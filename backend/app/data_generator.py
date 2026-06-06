"""
连锁便利店智能订货系统 - 数据模拟生成模块
生成三年历史销售数据，包含季节性、周末效应、节假日效应、促销增量等特征
"""

import os
import random
from datetime import date, timedelta
from typing import Dict, List, Tuple

import numpy as np
import pandas as pd
from dateutil.relativedelta import relativedelta


STORE_NAMES: List[str] = [
    "store_001", "store_002", "store_003", "store_004",
    "store_005", "store_006", "store_007", "store_008"
]

CATEGORY_CONFIG: Dict[str, Dict] = {
    "速食饮料": {
        "skus": ["泡面桶装", "瓶装可乐", "瓶装矿泉水", "功能饮料", "热饮奶茶粉"],
        "shelf_life_days": [180, 270, 365, 300, 180],
        "base_demand": [35, 50, 80, 25, 20],
        "price": [6.5, 3.5, 2.0, 6.0, 8.0],
        "is_short_life": False
    },
    "日用百货": {
        "skus": ["卫生纸卷", "洗衣液袋装", "牙刷", "洗发水袋装", "香皂"],
        "shelf_life_days": [1095, 540, 730, 365, 1095],
        "base_demand": [20, 12, 15, 10, 18],
        "price": [15.0, 12.0, 8.0, 5.0, 4.5],
        "is_short_life": False
    },
    "冷藏鲜奶": {
        "skus": ["鲜牛奶950ml", "酸奶杯装", "巴氏鲜奶250ml", "风味酸奶"],
        "shelf_life_days": [7, 10, 5, 12],
        "base_demand": [22, 18, 30, 15],
        "price": [16.8, 6.5, 5.0, 7.0],
        "is_short_life": True
    },
    "零食": {
        "skus": ["薯片大包", "巧克力", "坚果混合", "饼干盒装", "果冻"],
        "shelf_life_days": [180, 365, 240, 270, 365],
        "base_demand": [25, 20, 15, 22, 30],
        "price": [9.9, 12.0, 19.9, 8.5, 3.0],
        "is_short_life": False
    }
}

CHINESE_HOLIDAYS_2023_2025: List[Tuple[str, str, int]] = [
    ("2023-01-01", "元旦", 1),
    ("2023-01-21", "春节", 3),
    ("2023-04-05", "清明节", 1),
    ("2023-05-01", "劳动节", 1),
    ("2023-06-22", "端午节", 1),
    ("2023-09-29", "中秋节", 1),
    ("2023-10-01", "国庆节", 3),
    ("2024-01-01", "元旦", 1),
    ("2024-02-10", "春节", 3),
    ("2024-04-04", "清明节", 1),
    ("2024-05-01", "劳动节", 1),
    ("2024-06-10", "端午节", 1),
    ("2024-09-17", "中秋节", 1),
    ("2024-10-01", "国庆节", 3),
    ("2025-01-01", "元旦", 1),
    ("2025-01-29", "春节", 3),
    ("2025-04-04", "清明节", 1),
    ("2025-05-01", "劳动节", 1),
    ("2025-05-31", "端午节", 1),
    ("2025-10-01", "国庆节", 3),
    ("2025-10-06", "中秋节", 1),
]

COMMUNITY_ACTIVITY_LIST: List[str] = [
    "无", "小区市集", "亲子活动", "健身活动", "社区节日"
]

STORE_TRAFFIC_FACTOR: Dict[str, float] = {
    "store_001": 1.3,
    "store_002": 1.0,
    "store_003": 0.85,
    "store_004": 1.15,
    "store_005": 0.9,
    "store_006": 1.2,
    "store_007": 0.95,
    "store_008": 1.1
}


def generate_date_range(start_date: date, end_date: date) -> List[date]:
    """生成日期列表"""
    dates: List[date] = []
    current = start_date
    while current <= end_date:
        dates.append(current)
        current += timedelta(days=1)
    return dates


def is_holiday(d: date) -> Tuple[bool, str]:
    """判断是否为节假日"""
    date_str = d.strftime("%Y-%m-%d")
    for holiday_date, holiday_name, duration in CHINESE_HOLIDAYS_2023_2025:
        hd = date.fromisoformat(holiday_date)
        for i in range(duration):
            if d == hd + timedelta(days=i):
                return True, holiday_name
    return False, ""


def get_temperature(d: date, store_idx: int) -> float:
    """模拟气温数据，具有季节性波动"""
    day_of_year = d.timetuple().tm_yday
    base_temp = 15 + 15 * np.sin(2 * np.pi * (day_of_year - 80) / 365)
    variation = np.random.normal(0, 3)
    store_diff = (store_idx - 3.5) * 0.8
    return round(float(base_temp + variation + store_diff), 1)


def get_seasonal_factor(d: date, category: str) -> float:
    """计算季节因素"""
    day_of_year = d.timetuple().tm_yday
    
    if category == "速食饮料":
        return 1.0 + 0.3 * np.sin(2 * np.pi * (day_of_year - 180) / 365)
    elif category == "冷藏鲜奶":
        return 1.0 + 0.2 * np.sin(2 * np.pi * (day_of_year - 200) / 365)
    elif category == "零食":
        return 1.0 + 0.15 * np.sin(2 * np.pi * (day_of_year - 300) / 365)
    else:
        return 1.0 + 0.05 * np.sin(2 * np.pi * (day_of_year - 150) / 365)


def get_weekend_factor(d: date, category: str) -> float:
    """计算周末效应"""
    weekday = d.weekday()
    if weekday >= 5:
        if category in ["速食饮料", "零食"]:
            return 1.3
        elif category == "日用百货":
            return 1.5
        elif category == "冷藏鲜奶":
            return 1.2
    return 1.0


def get_holiday_factor(d: date, category: str) -> float:
    """计算节假日效应"""
    is_hol, hol_name = is_holiday(d)
    if not is_hol:
        return 1.0
    
    if hol_name == "春节":
        if category in ["零食", "饮料"]:
            return 1.8
        elif category == "日用百货":
            return 1.5
        elif category == "冷藏鲜奶":
            return 0.7
        return 1.3
    
    if hol_name in ["国庆节", "劳动节"]:
        if category in ["零食", "速食饮料"]:
            return 1.5
        return 1.2
    
    return 1.2


def get_promotion_info(d: date, category: str, sku_idx: int) -> Tuple[bool, float, float]:
    """获取促销信息（是否促销、折扣率、促销强度）"""
    month = d.month
    day = d.day
    
    is_promo = False
    discount = 1.0
    promo_intensity = 0.0
    
    if day >= 15 and day <= 20:
        promo_prob = 0.4
        if np.random.random() < promo_prob:
            is_promo = True
            discount = round(0.7 + np.random.random() * 0.2, 2)
            promo_intensity = 1.0 - discount
    
    if month in [6, 11] and sku_idx % 2 == 0:
        big_promo_prob = 0.6
        if np.random.random() < big_promo_prob:
            is_promo = True
            discount = round(0.6 + np.random.random() * 0.2, 2)
            promo_intensity = 1.0 - discount
    
    return is_promo, discount, promo_intensity


def get_community_activity(d: date, store_idx: int) -> Tuple[str, float]:
    """获取小区活动信息"""
    if d.weekday() >= 5 and np.random.random() < 0.15:
        activity = np.random.choice(COMMUNITY_ACTIVITY_LIST[1:])
        impact = 0.1 + np.random.random() * 0.2
        return activity, impact
    
    if np.random.random() < 0.05:
        activity = np.random.choice(COMMUNITY_ACTIVITY_LIST[1:])
        impact = 0.05 + np.random.random() * 0.1
        return activity, impact
    
    return "无", 0.0


def calculate_daily_sales(
    base_demand: float,
    seasonal_factor: float,
    weekend_factor: float,
    holiday_factor: float,
    promo_factor: float,
    community_factor: float,
    temp_factor: float,
    store_factor: float,
    random_noise: float
) -> int:
    """计算日销量"""
    sales = (
        base_demand *
        seasonal_factor *
        weekend_factor *
        holiday_factor *
        promo_factor *
        community_factor *
        temp_factor *
        store_factor *
        random_noise
    )
    return max(0, int(round(sales)))


def get_temp_impact(temperature: float, category: str) -> float:
    """气温对销量的影响"""
    if category == "速食饮料":
        if temperature > 25:
            return 1.0 + (temperature - 25) * 0.03
        elif temperature < 10:
            return max(0.7, 1.0 - (10 - temperature) * 0.02)
    elif category == "冷藏鲜奶":
        if temperature > 28:
            return 1.0 + (temperature - 28) * 0.02
        elif temperature < 5:
            return max(0.8, 1.0 - (5 - temperature) * 0.01)
    return 1.0


def generate_waste(sales: int, shelf_life: int, is_short_life: bool) -> int:
    """生成报废数据"""
    if not is_short_life:
        return 0
    
    waste_rate_base = 0.03 + 7 / (shelf_life * 2)
    waste = int(sales * waste_rate_base * np.random.uniform(0.5, 1.5))
    return max(0, waste)


def generate_all_data(
    start_date: date = date(2023, 1, 1),
    end_date: date = date(2025, 12, 31),
    output_dir: str = "data",
    random_seed: int = 42
) -> str:
    """
    生成所有模拟数据并保存为CSV文件
    
    Args:
        start_date: 开始日期
        end_date: 结束日期
        output_dir: 输出目录
        random_seed: 随机种子
    
    Returns:
        输出文件路径
    """
    np.random.seed(random_seed)
    random.seed(random_seed)
    
    os.makedirs(output_dir, exist_ok=True)
    
    dates = generate_date_range(start_date, end_date)
    print(f"生成 {len(dates)} 天的数据...")
    
    records: List[Dict] = []
    
    for store_idx, store_name in enumerate(STORE_NAMES):
        print(f"正在生成门店 {store_name} 的数据...")
        store_factor = STORE_TRAFFIC_FACTOR[store_name]
        
        for category_name, category_info in CATEGORY_CONFIG.items():
            skus = category_info["skus"]
            shelf_lives = category_info["shelf_life_days"]
            base_demands = category_info["base_demand"]
            prices = category_info["price"]
            is_short_life = category_info["is_short_life"]
            
            for sku_idx, sku_name in enumerate(skus):
                shelf_life = shelf_lives[sku_idx]
                base_demand = base_demands[sku_idx]
                price = prices[sku_idx]
                
                for d in dates:
                    temperature = get_temperature(d, store_idx)
                    
                    seasonal_factor = get_seasonal_factor(d, category_name)
                    weekend_factor = get_weekend_factor(d, category_name)
                    holiday_factor = get_holiday_factor(d, category_name)
                    temp_factor = get_temp_impact(temperature, category_name)
                    
                    is_promo, discount, promo_intensity = get_promotion_info(d, category_name, sku_idx)
                    promo_factor = 1.0 + promo_intensity * 1.5 if is_promo else 1.0
                    
                    community_activity, community_impact = get_community_activity(d, store_idx)
                    community_factor = 1.0 + community_impact
                    
                    random_noise = np.random.normal(1.0, 0.1)
                    
                    sales = calculate_daily_sales(
                        base_demand=base_demand,
                        seasonal_factor=seasonal_factor,
                        weekend_factor=weekend_factor,
                        holiday_factor=holiday_factor,
                        promo_factor=promo_factor,
                        community_factor=community_factor,
                        temp_factor=temp_factor,
                        store_factor=store_factor,
                        random_noise=random_noise
                    )
                    
                    waste = generate_waste(sales, shelf_life, is_short_life)
                    
                    is_hol, hol_name = is_holiday(d)
                    
                    record = {
                        "date": d.strftime("%Y-%m-%d"),
                        "store_id": store_name,
                        "category": category_name,
                        "sku": sku_name,
                        "sales_quantity": sales,
                        "waste_quantity": waste,
                        "unit_price": price,
                        "sales_amount": round(sales * price, 2),
                        "waste_amount": round(waste * price, 2),
                        "temperature": temperature,
                        "is_weekend": 1 if d.weekday() >= 5 else 0,
                        "is_holiday": 1 if is_hol else 0,
                        "holiday_name": hol_name if is_hol else "",
                        "is_promotion": 1 if is_promo else 0,
                        "discount_rate": discount,
                        "promotion_intensity": promo_intensity,
                        "community_activity": community_activity,
                        "community_impact": community_impact,
                        "shelf_life_days": shelf_life,
                        "is_short_shelf": 1 if is_short_life else 0,
                        "weekday": d.weekday(),
                        "month": d.month,
                        "year": d.year
                    }
                    records.append(record)
    
    df = pd.DataFrame(records)
    
    output_path = os.path.join(output_dir, "historical_sales_data.csv")
    df.to_csv(output_path, index=False, encoding="utf-8-sig")
    
    print(f"\n数据生成完成！共 {len(df)} 条记录")
    print(f"数据已保存至: {output_path}")
    print(f"\n数据概览:")
    print(f"  门店数量: {df['store_id'].nunique()}")
    print(f"  品类数量: {df['category'].nunique()}")
    print(f"  SKU数量: {df['sku'].nunique()}")
    print(f"  日期范围: {df['date'].min()} ~ {df['date'].max()}")
    print(f"  总销量: {df['sales_quantity'].sum()}")
    print(f"  总报废量: {df['waste_quantity'].sum()}")
    
    return output_path


def generate_store_info(output_dir: str = "data") -> str:
    """生成门店信息表"""
    store_data = []
    for idx, store_name in enumerate(STORE_NAMES):
        store_data.append({
            "store_id": store_name,
            "store_name": f"便利店{idx+1}号店",
            "area": round(80 + np.random.randint(-20, 40), 1),
            "location_type": ["商圈店", "社区店", "学校店", "办公区店"][idx % 4],
            "open_date": f"202{1 + idx % 3}-01-01",
            "traffic_factor": STORE_TRAFFIC_FACTOR[store_name]
        })
    
    df = pd.DataFrame(store_data)
    output_path = os.path.join(output_dir, "store_info.csv")
    df.to_csv(output_path, index=False, encoding="utf-8-sig")
    print(f"门店信息已保存至: {output_path}")
    return output_path


def generate_sku_info(output_dir: str = "data") -> str:
    """生成商品信息表"""
    sku_data = []
    sku_id = 1
    for category_name, category_info in CATEGORY_CONFIG.items():
        skus = category_info["skus"]
        shelf_lives = category_info["shelf_life_days"]
        prices = category_info["price"]
        is_short_life = category_info["is_short_life"]
        
        for idx, sku_name in enumerate(skus):
            sku_data.append({
                "sku_id": f"SKU{sku_id:04d}",
                "sku_name": sku_name,
                "category": category_name,
                "shelf_life_days": shelf_lives[idx],
                "unit_price": prices[idx],
                "is_short_shelf": 1 if is_short_life else 0,
                "supplier": f"供应商{(sku_id % 5) + 1}"
            })
            sku_id += 1
    
    df = pd.DataFrame(sku_data)
    output_path = os.path.join(output_dir, "sku_info.csv")
    df.to_csv(output_path, index=False, encoding="utf-8-sig")
    print(f"商品信息已保存至: {output_path}")
    return output_path


if __name__ == "__main__":
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    data_dir = os.path.join(base_dir, "data")
    
    print("=" * 60)
    print("连锁便利店智能订货系统 - 数据模拟生成")
    print("=" * 60)
    
    generate_all_data(output_dir=data_dir)
    generate_store_info(output_dir=data_dir)
    generate_sku_info(output_dir=data_dir)
    
    print("\n" + "=" * 60)
    print("所有数据生成完成！")
    print("=" * 60)
