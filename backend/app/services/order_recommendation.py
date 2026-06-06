import math
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Any
from enum import Enum


class ProductCategory(Enum):
    SHORT_SHELF_LIFE = "short_shelf_life"
    MEDIUM_SHELF_LIFE = "medium_shelf_life"
    LONG_SHELF_LIFE = "long_shelf_life"
    DAILY_NECESSITIES = "daily_necessities"


@dataclass
class SKUInfo:
    sku_id: str
    sku_name: str
    category: ProductCategory
    shelf_life_days: int
    unit_price: float
    safety_stock_base: float = 0.0


@dataclass
class InventoryInfo:
    sku_id: str
    current_stock: float
    in_transit_stock: float = 0.0
    replenishment_cycle_days: int = 1


@dataclass
class OrderRecommendation:
    store_id: str
    sku_id: str
    sku_name: str
    category: str
    recommended_quantity: float
    predicted_sales_7d: float
    current_stock: float
    in_transit_stock: float
    safety_coefficient: float
    replenishment_cycle_days: int
    shelf_life_days: int
    turnover_days: float
    warning_level: str = "normal"
    reason: str = ""


class OrderRecommendationService:
    def __init__(self):
        self.category_safety_coefficients = {
            ProductCategory.SHORT_SHELF_LIFE: 1.1,
            ProductCategory.MEDIUM_SHELF_LIFE: 1.2,
            ProductCategory.LONG_SHELF_LIFE: 1.4,
            ProductCategory.DAILY_NECESSITIES: 1.5,
        }

        self.category_max_safety_coefficient = {
            ProductCategory.SHORT_SHELF_LIFE: 1.3,
            ProductCategory.MEDIUM_SHELF_LIFE: 1.5,
            ProductCategory.LONG_SHELF_LIFE: 1.8,
            ProductCategory.DAILY_NECESSITIES: 2.0,
        }

        self.shelf_life_thresholds = {
            ProductCategory.SHORT_SHELF_LIFE: 7,
            ProductCategory.MEDIUM_SHELF_LIFE: 30,
            ProductCategory.LONG_SHELF_LIFE: 180,
            ProductCategory.DAILY_NECESSITIES: 365,
        }

    def classify_product(self, shelf_life_days: int) -> ProductCategory:
        if shelf_life_days <= 7:
            return ProductCategory.SHORT_SHELF_LIFE
        elif shelf_life_days <= 30:
            return ProductCategory.MEDIUM_SHELF_LIFE
        elif shelf_life_days <= 180:
            return ProductCategory.LONG_SHELF_LIFE
        else:
            return ProductCategory.DAILY_NECESSITIES

    def calculate_safety_coefficient(
        self,
        sku_info: SKUInfo,
        predicted_sales: List[float],
        historical_sales: Optional[List[float]] = None,
    ) -> float:
        base_coeff = self.category_safety_coefficients.get(
            sku_info.category, 1.3
        )
        max_coeff = self.category_max_safety_coefficient.get(
            sku_info.category, 2.0
        )

        cv = 0.0
        if historical_sales and len(historical_sales) > 1:
            mean_sales = sum(historical_sales) / len(historical_sales)
            if mean_sales > 0:
                variance = sum((x - mean_sales) ** 2 for x in historical_sales) / len(historical_sales)
                std_dev = math.sqrt(variance)
                cv = std_dev / mean_sales

        volatility_factor = 1.0 + cv * 0.3
        volatility_factor = min(volatility_factor, 1.5)

        shelf_life_factor = 1.0
        if sku_info.shelf_life_days > 0:
            shelf_life_factor = min(1.0, 7.0 / sku_info.shelf_life_days)
            shelf_life_factor = 0.7 + 0.3 * shelf_life_factor

        predicted_cv = 0.0
        if predicted_sales and len(predicted_sales) > 1:
            mean_pred = sum(predicted_sales) / len(predicted_sales)
            if mean_pred > 0:
                variance = sum((x - mean_pred) ** 2 for x in predicted_sales) / len(predicted_sales)
                std_dev = math.sqrt(variance)
                predicted_cv = std_dev / mean_pred

        predicted_volatility_factor = 1.0 + predicted_cv * 0.2

        safety_coeff = (
            base_coeff * volatility_factor * shelf_life_factor * predicted_volatility_factor
        )

        safety_coeff = min(safety_coeff, max_coeff)
        safety_coeff = max(safety_coeff, base_coeff * 0.8)

        return round(safety_coeff, 3)

    def calculate_turnover_days(
        self,
        current_stock: float,
        predicted_sales: List[float],
    ) -> float:
        if not predicted_sales:
            return float("inf")

        avg_daily_sales = sum(predicted_sales) / len(predicted_sales)
        if avg_daily_sales <= 0:
            return float("inf")

        return current_stock / avg_daily_sales

    def calculate_warning_level(
        self,
        turnover_days: float,
        shelf_life_days: int,
        category: ProductCategory,
    ) -> str:
        if math.isinf(turnover_days) or turnover_days <= 0:
            return "normal"

        if category == ProductCategory.SHORT_SHELF_LIFE:
            if turnover_days > shelf_life_days * 0.8:
                return "critical"
            elif turnover_days > shelf_life_days * 0.6:
                return "warning"
        else:
            if turnover_days > shelf_life_days * 0.7:
                return "critical"
            elif turnover_days > shelf_life_days * 0.5:
                return "warning"

        return "normal"

    def generate_recommendation(
        self,
        store_id: str,
        sku_info: SKUInfo,
        inventory_info: InventoryInfo,
        predicted_sales: List[float],
        historical_sales: Optional[List[float]] = None,
    ) -> OrderRecommendation:
        safety_coeff = self.calculate_safety_coefficient(
            sku_info, predicted_sales, historical_sales
        )

        total_predicted_sales = sum(predicted_sales)

        cycle_factor = inventory_info.replenishment_cycle_days / len(predicted_sales)
        cycle_factor = min(cycle_factor, 1.0)

        required_stock = total_predicted_sales * safety_coeff * cycle_factor

        recommended_quantity = (
            required_stock
            - inventory_info.current_stock
            - inventory_info.in_transit_stock
        )

        recommended_quantity = max(0.0, recommended_quantity)
        recommended_quantity = math.ceil(recommended_quantity)

        turnover_days = self.calculate_turnover_days(
            inventory_info.current_stock, predicted_sales
        )

        warning_level = self.calculate_warning_level(
            turnover_days, sku_info.shelf_life_days, sku_info.category
        )

        reason_parts = []
        if sku_info.category == ProductCategory.SHORT_SHELF_LIFE:
            reason_parts.append("短保商品，压低备货量降低损耗风险")
        elif sku_info.category == ProductCategory.DAILY_NECESSITIES:
            reason_parts.append("日用品，较高安全库存保障供应")

        if warning_level == "critical":
            reason_parts.append("库存周转天数接近保质期，建议减少订货")
        elif warning_level == "warning":
            reason_parts.append("库存周转偏高，注意控制库存")

        if inventory_info.in_transit_stock > 0:
            reason_parts.append(f"在途库存{inventory_info.in_transit_stock}件已扣除")

        reason = "；".join(reason_parts) if reason_parts else "正常推荐"

        return OrderRecommendation(
            store_id=store_id,
            sku_id=sku_info.sku_id,
            sku_name=sku_info.sku_name,
            category=sku_info.category.value,
            recommended_quantity=recommended_quantity,
            predicted_sales_7d=round(total_predicted_sales, 2),
            current_stock=inventory_info.current_stock,
            in_transit_stock=inventory_info.in_transit_stock,
            safety_coefficient=safety_coeff,
            replenishment_cycle_days=inventory_info.replenishment_cycle_days,
            shelf_life_days=sku_info.shelf_life_days,
            turnover_days=round(turnover_days, 2) if not math.isinf(turnover_days) else float("inf"),
            warning_level=warning_level,
            reason=reason,
        )

    def batch_generate_recommendations(
        self,
        store_id: str,
        sku_infos: List[SKUInfo],
        inventory_infos: List[InventoryInfo],
        predictions_map: Dict[str, List[float]],
        historical_sales_map: Optional[Dict[str, List[float]]] = None,
    ) -> List[OrderRecommendation]:
        inventory_dict = {inv.sku_id: inv for inv in inventory_infos}
        historical_dict = historical_sales_map or {}

        recommendations = []

        for sku_info in sku_infos:
            if sku_info.sku_id not in predictions_map:
                continue

            predicted_sales = predictions_map[sku_info.sku_id]
            inventory_info = inventory_dict.get(
                sku_info.sku_id,
                InventoryInfo(sku_id=sku_info.sku_id, current_stock=0.0),
            )
            historical_sales = historical_dict.get(sku_info.sku_id)

            recommendation = self.generate_recommendation(
                store_id=store_id,
                sku_info=sku_info,
                inventory_info=inventory_info,
                predicted_sales=predicted_sales,
                historical_sales=historical_sales,
            )
            recommendations.append(recommendation)

        recommendations.sort(key=lambda x: x.recommended_quantity, reverse=True)

        return recommendations

    def get_recommendations_by_category(
        self, recommendations: List[OrderRecommendation]
    ) -> Dict[str, List[OrderRecommendation]]:
        category_map: Dict[str, List[OrderRecommendation]] = {}

        for rec in recommendations:
            if rec.category not in category_map:
                category_map[rec.category] = []
            category_map[rec.category].append(rec)

        return category_map

    def get_summary_statistics(
        self, recommendations: List[OrderRecommendation]
    ) -> Dict[str, Any]:
        if not recommendations:
            return {
                "total_skus": 0,
                "total_recommended_quantity": 0.0,
                "total_predicted_sales_7d": 0.0,
                "critical_warnings": 0,
                "warning_warnings": 0,
                "normal_skus": 0,
                "by_category": {},
            }

        total_quantity = sum(rec.recommended_quantity for rec in recommendations)
        total_predicted = sum(rec.predicted_sales_7d for rec in recommendations)

        critical = sum(1 for rec in recommendations if rec.warning_level == "critical")
        warning = sum(1 for rec in recommendations if rec.warning_level == "warning")
        normal = sum(1 for rec in recommendations if rec.warning_level == "normal")

        by_category = {}
        for rec in recommendations:
            if rec.category not in by_category:
                by_category[rec.category] = {
                    "count": 0,
                    "total_recommended": 0.0,
                    "total_predicted": 0.0,
                }
            by_category[rec.category]["count"] += 1
            by_category[rec.category]["total_recommended"] += rec.recommended_quantity
            by_category[rec.category]["total_predicted"] += rec.predicted_sales_7d

        return {
            "total_skus": len(recommendations),
            "total_recommended_quantity": round(total_quantity, 2),
            "total_predicted_sales_7d": round(total_predicted, 2),
            "critical_warnings": critical,
            "warning_warnings": warning,
            "normal_skus": normal,
            "by_category": by_category,
        }

    def adjust_for_promotion(
        self,
        recommendation: OrderRecommendation,
        promotion_factor: float = 1.0,
        is_promotion: bool = False,
    ) -> OrderRecommendation:
        if not is_promotion or promotion_factor <= 1.0:
            return recommendation

        adjusted_quantity = recommendation.recommended_quantity * promotion_factor
        adjusted_quantity = math.ceil(adjusted_quantity)

        new_reason = recommendation.reason
        if "促销" not in new_reason:
            new_reason = f"促销加成（x{promotion_factor}）；{new_reason}"

        return OrderRecommendation(
            store_id=recommendation.store_id,
            sku_id=recommendation.sku_id,
            sku_name=recommendation.sku_name,
            category=recommendation.category,
            recommended_quantity=adjusted_quantity,
            predicted_sales_7d=recommendation.predicted_sales_7d * promotion_factor,
            current_stock=recommendation.current_stock,
            in_transit_stock=recommendation.in_transit_stock,
            safety_coefficient=recommendation.safety_coefficient,
            replenishment_cycle_days=recommendation.replenishment_cycle_days,
            shelf_life_days=recommendation.shelf_life_days,
            turnover_days=recommendation.turnover_days,
            warning_level=recommendation.warning_level,
            reason=new_reason,
        )
