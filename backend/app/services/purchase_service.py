import json
import os
import uuid
from datetime import datetime, date, timedelta
from typing import List, Optional, Dict, Tuple
from pathlib import Path

from app.models.schemas import (
    PurchaseOrder,
    PurchaseOrderItem,
    PurchaseOverview,
    StockInRecord,
)
from app.services.data_service import DataService


PURCHASE_STATUS_PENDING = "待确认"
PURCHASE_STATUS_ORDERED = "已下单"
PURCHASE_STATUS_DELIVERING = "配送中"
PURCHASE_STATUS_ARRIVED = "已到货"
PURCHASE_STATUS_CANCELLED = "已取消"

CATEGORY_SUPPLIER_MAP = {
    "速食饮料": "速食饮料供应商",
    "日用百货": "日用百货供应商",
    "冷藏鲜奶": "鲜奶配送供应商",
    "零食": "零食批发供应商",
}

CATEGORY_DELIVERY_DAYS = {
    "速食饮料": 2,
    "日用百货": 3,
    "冷藏鲜奶": 1,
    "零食": 2,
}


class PurchaseService:
    _instance = None
    _initialized = False

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self):
        if self._initialized:
            return
        self._initialized = True

        base_dir = Path(__file__).parent.parent.parent
        self.data_dir = base_dir / "data"
        self.data_dir.mkdir(parents=True, exist_ok=True)

        self.purchase_file = self.data_dir / "purchase_orders.json"
        self.stock_in_file = self.data_dir / "stock_in_records.json"
        self.inventory_file = self.data_dir / "inventory.json"

        self.data_service = DataService()

        self._init_data_files()

    def _init_data_files(self):
        if not self.purchase_file.exists():
            self._write_json(self.purchase_file, [])
        if not self.stock_in_file.exists():
            self._write_json(self.stock_in_file, [])
        if not self.inventory_file.exists():
            self._init_inventory()

    def _init_inventory(self):
        products = self.data_service.get_all_products()
        stores = self.data_service.get_all_stores()
        inventory = {}

        for store in stores:
            store_id = store["store_id"]
            inventory[store_id] = {}
            for product in products:
                sku = product["sku_id"]
                inventory[store_id][sku] = {
                    "sku": sku,
                    "product_name": product["sku_name"],
                    "category": product["category"],
                    "quantity": round(20 + 50 * (hash(sku) % 10) / 10, 2),
                    "unit": "个",
                    "last_updated": datetime.now().isoformat(),
                }

        self._write_json(self.inventory_file, inventory)

    def _read_json(self, file_path: Path) -> List[Dict]:
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                return json.load(f)
        except (json.JSONDecodeError, FileNotFoundError):
            return []

    def _write_json(self, file_path: Path, data):
        with open(file_path, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

    def _generate_po_no(self) -> str:
        today = date.today().strftime("%Y%m%d")
        orders = self._read_json(self.purchase_file)
        today_orders = [o for o in orders if o.get("po_no", "").startswith(f"PO{today}")]
        sequence = len(today_orders) + 1
        return f"PO{today}{sequence:04d}"

    def _get_supplier_by_category(self, category: str) -> str:
        return CATEGORY_SUPPLIER_MAP.get(category, "综合供应商")

    def _get_delivery_days(self, category: str) -> int:
        return CATEGORY_DELIVERY_DAYS.get(category, 2)

    def create_purchase_order(
        self,
        store_id: str,
        store_name: str,
        items: List[PurchaseOrderItem],
        category: str = "",
        remark: str = "",
    ) -> PurchaseOrder:
        if not items:
            raise ValueError("采购单商品明细不能为空")

        main_category = category or items[0].category
        supplier = self._get_supplier_by_category(main_category)
        delivery_days = self._get_delivery_days(main_category)
        estimated_arrival = date.today() + timedelta(days=delivery_days)

        total_amount = sum(item.amount for item in items)
        total_quantity = sum(item.adjusted_order for item in items)

        po_id = str(uuid.uuid4())
        po_no = self._generate_po_no()
        now = datetime.now()

        purchase_order = PurchaseOrder(
            id=po_id,
            po_no=po_no,
            store_id=store_id,
            store_name=store_name,
            supplier=supplier,
            category=main_category,
            total_amount=round(total_amount, 2),
            total_quantity=round(total_quantity, 2),
            estimated_arrival_date=estimated_arrival,
            status=PURCHASE_STATUS_PENDING,
            remark=remark,
            items=items,
            created_at=now,
            updated_at=now,
        )

        orders = self._read_json(self.purchase_file)
        orders.append(self._purchase_order_to_dict(purchase_order))
        self._write_json(self.purchase_file, orders)

        return purchase_order

    def _purchase_order_to_dict(self, po: PurchaseOrder) -> Dict:
        return {
            "id": po.id,
            "po_no": po.po_no,
            "store_id": po.store_id,
            "store_name": po.store_name,
            "supplier": po.supplier,
            "category": po.category,
            "total_amount": po.total_amount,
            "total_quantity": po.total_quantity,
            "estimated_arrival_date": po.estimated_arrival_date.isoformat() if isinstance(po.estimated_arrival_date, date) else po.estimated_arrival_date,
            "status": po.status,
            "remark": po.remark or "",
            "items": [self._item_to_dict(item) for item in po.items],
            "created_at": po.created_at.isoformat() if isinstance(po.created_at, datetime) else po.created_at,
            "updated_at": po.updated_at.isoformat() if isinstance(po.updated_at, datetime) else po.updated_at,
        }

    def _item_to_dict(self, item: PurchaseOrderItem) -> Dict:
        return {
            "sku": item.sku,
            "product_name": item.product_name,
            "category": item.category,
            "suggested_order": item.suggested_order,
            "adjusted_order": item.adjusted_order,
            "actual_arrival": item.actual_arrival or 0.0,
            "unit": item.unit,
            "price": item.price,
            "amount": item.amount,
            "adjust_reason": item.adjust_reason or "",
            "is_adjusted": item.is_adjusted or False,
        }

    def _dict_to_purchase_order(self, data: Dict) -> PurchaseOrder:
        return PurchaseOrder(
            id=data["id"],
            po_no=data["po_no"],
            store_id=data["store_id"],
            store_name=data["store_name"],
            supplier=data["supplier"],
            category=data.get("category", ""),
            total_amount=data["total_amount"],
            total_quantity=data["total_quantity"],
            estimated_arrival_date=date.fromisoformat(data["estimated_arrival_date"]) if isinstance(data["estimated_arrival_date"], str) else data["estimated_arrival_date"],
            status=data["status"],
            remark=data.get("remark", ""),
            items=[PurchaseOrderItem(**item) for item in data["items"]],
            created_at=datetime.fromisoformat(data["created_at"]) if isinstance(data["created_at"], str) else data["created_at"],
            updated_at=datetime.fromisoformat(data["updated_at"]) if isinstance(data["updated_at"], str) else data["updated_at"],
        )

    def get_purchase_orders(
        self,
        status: Optional[str] = None,
        store_id: Optional[str] = None,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
    ) -> Tuple[List[PurchaseOrder], int]:
        orders = self._read_json(self.purchase_file)

        if status and status != "all":
            orders = [o for o in orders if o["status"] == status]

        if store_id and store_id != "all":
            orders = [o for o in orders if o["store_id"] == store_id]

        if start_date:
            orders = [
                o for o in orders
                if date.fromisoformat(o["created_at"][:10]) >= start_date
            ]

        if end_date:
            orders = [
                o for o in orders
                if date.fromisoformat(o["created_at"][:10]) <= end_date
            ]

        orders.sort(key=lambda x: x["created_at"], reverse=True)

        po_list = [self._dict_to_purchase_order(o) for o in orders]
        return po_list, len(po_list)

    def get_purchase_order_by_id(self, po_id: str) -> Optional[PurchaseOrder]:
        orders = self._read_json(self.purchase_file)
        for order in orders:
            if order["id"] == po_id:
                return self._dict_to_purchase_order(order)
        return None

    def update_status(self, po_id: str, status: str) -> Optional[PurchaseOrder]:
        orders = self._read_json(self.purchase_file)
        for i, order in enumerate(orders):
            if order["id"] == po_id:
                orders[i]["status"] = status
                orders[i]["updated_at"] = datetime.now().isoformat()
                self._write_json(self.purchase_file, orders)
                return self._dict_to_purchase_order(orders[i])
        return None

    def confirm_arrival(
        self,
        po_id: str,
        arrival_items: List[Dict],
    ) -> Optional[PurchaseOrder]:
        po = self.get_purchase_order_by_id(po_id)
        if not po:
            return None

        orders = self._read_json(self.purchase_file)
        stock_in_records = self._read_json(self.stock_in_file)
        inventory = self._read_json(self.inventory_file)

        arrival_map = {item["sku"]: item["actual_arrival"] for item in arrival_items}

        total_actual = 0.0
        for i, order in enumerate(orders):
            if order["id"] == po_id:
                for item in order["items"]:
                    actual = arrival_map.get(item["sku"], 0)
                    item["actual_arrival"] = actual
                    total_actual += actual

                    if actual > 0:
                        stock_record = StockInRecord(
                            id=str(uuid.uuid4()),
                            po_no=order["po_no"],
                            sku=item["sku"],
                            product_name=item["product_name"],
                            quantity=actual,
                            unit=item["unit"],
                            price=item["price"],
                            amount=round(actual * item["price"], 2),
                            store_id=order["store_id"],
                            created_at=datetime.now(),
                        )
                        stock_in_records.append(self._stock_in_to_dict(stock_record))

                        store_inv = inventory.get(order["store_id"], {})
                        if item["sku"] in store_inv:
                            store_inv[item["sku"]]["quantity"] += actual
                            store_inv[item["sku"]]["last_updated"] = datetime.now().isoformat()
                        else:
                            store_inv[item["sku"]] = {
                                "sku": item["sku"],
                                "product_name": item["product_name"],
                                "category": item["category"],
                                "quantity": actual,
                                "unit": item["unit"],
                                "last_updated": datetime.now().isoformat(),
                            }
                        inventory[order["store_id"]] = store_inv

                orders[i]["status"] = PURCHASE_STATUS_ARRIVED
                orders[i]["updated_at"] = datetime.now().isoformat()
                break

        self._write_json(self.purchase_file, orders)
        self._write_json(self.stock_in_file, stock_in_records)
        self._write_json(self.inventory_file, inventory)

        return self.get_purchase_order_by_id(po_id)

    def _stock_in_to_dict(self, record: StockInRecord) -> Dict:
        return {
            "id": record.id,
            "po_no": record.po_no,
            "sku": record.sku,
            "product_name": record.product_name,
            "quantity": record.quantity,
            "unit": record.unit,
            "price": record.price,
            "amount": record.amount,
            "store_id": record.store_id,
            "created_at": record.created_at.isoformat() if isinstance(record.created_at, datetime) else record.created_at,
        }

    def get_inventory(self, store_id: str, sku: Optional[str] = None) -> Optional[Dict]:
        inventory = self._read_json(self.inventory_file)
        store_inv = inventory.get(store_id, {})
        if sku:
            return store_inv.get(sku)
        return store_inv

    def get_purchase_overview(self) -> PurchaseOverview:
        orders = self._read_json(self.purchase_file)
        today = date.today()
        week_start = today - timedelta(days=today.weekday())
        month_start = today.replace(day=1)

        pending_count = len([
            o for o in orders
            if o["status"] == PURCHASE_STATUS_PENDING
            and date.fromisoformat(o["created_at"][:10]) >= week_start
        ])

        delivering_count = len([
            o for o in orders
            if o["status"] == PURCHASE_STATUS_DELIVERING
        ])

        monthly_amount = sum(
            o["total_amount"]
            for o in orders
            if date.fromisoformat(o["created_at"][:10]) >= month_start
            and o["status"] != PURCHASE_STATUS_CANCELLED
        )

        arrived_orders = [
            o for o in orders
            if o["status"] == PURCHASE_STATUS_ARRIVED
        ]

        total_ordered = 0.0
        total_arrived = 0.0
        for order in arrived_orders:
            for item in order["items"]:
                total_ordered += item["adjusted_order"]
                total_arrived += item.get("actual_arrival", 0)

        arrival_rate = total_arrived / total_ordered if total_ordered > 0 else 0.95

        return PurchaseOverview(
            pending_confirm_count=pending_count,
            in_delivery_count=delivering_count,
            monthly_total_amount=round(monthly_amount, 2),
            average_arrival_rate=round(arrival_rate, 4),
        )

    def get_stock_in_records(
        self,
        store_id: Optional[str] = None,
        sku: Optional[str] = None,
    ) -> List[StockInRecord]:
        records = self._read_json(self.stock_in_file)

        if store_id and store_id != "all":
            records = [r for r in records if r["store_id"] == store_id]

        if sku:
            records = [r for r in records if r["sku"] == sku]

        records.sort(key=lambda x: x["created_at"], reverse=True)

        return [
            StockInRecord(
                id=r["id"],
                po_no=r["po_no"],
                sku=r["sku"],
                product_name=r["product_name"],
                quantity=r["quantity"],
                unit=r["unit"],
                price=r["price"],
                amount=r["amount"],
                store_id=r["store_id"],
                created_at=datetime.fromisoformat(r["created_at"]),
            )
            for r in records
        ]
