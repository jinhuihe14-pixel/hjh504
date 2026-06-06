import math
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Any
from enum import Enum


class WasteSeverity(Enum):
    CRITICAL = "critical"
    WARNING = "warning"
    ATTENTION = "attention"
    NORMAL = "normal"


@dataclass
class WasteRecord:
    sku_id: str
    date: str
    waste_quantity: float
    waste_reason: str = ""
    waste_value: float = 0.0


@dataclass
class SalesRecord:
    sku_id: str
    date: str
    sales_quantity: float
    sales_amount: float = 0.0


@dataclass
class SKUWasteAnalysis:
    sku_id: str
    sku_name: str
    category: str
    total_waste_quantity: float
    total_waste_value: float
    total_sales_quantity: float
    waste_rate: float
    turnover_days: float
    average_daily_sales: float
    current_stock: float
    shelf_life_days: int
    severity: WasteSeverity
    waste_trend: List[float]
    reasons: List[str]
    suggestions: List[str] = field(default_factory=list)


@dataclass
class WasteAnalysisResult:
    store_id: str
    analysis_period: str
    total_skus: int
    high_waste_skus: List[SKUWasteAnalysis]
    total_waste_value: float
    overall_waste_rate: float
    category_breakdown: Dict[str, Dict[str, Any]]


class WasteAnalysisService:
    def __init__(self):
        self.waste_rate_thresholds = {
            WasteSeverity.CRITICAL: 0.15,
            WasteSeverity.WARNING: 0.08,
            WasteSeverity.ATTENTION: 0.03,
        }

        self.turnover_threshold_ratio = {
            WasteSeverity.CRITICAL: 0.7,
            WasteSeverity.WARNING: 0.5,
            WasteSeverity.ATTENTION: 0.3,
        }

    def calculate_waste_rate(
        self, total_waste: float, total_sales: float
    ) -> float:
        if total_sales <= 0 and total_waste <= 0:
            return 0.0
        if total_sales <= 0:
            return 1.0
        return total_waste / (total_sales + total_waste)

    def calculate_turnover_days(
        self, current_stock: float, average_daily_sales: float
    ) -> float:
        if average_daily_sales <= 0:
            return float("inf")
        return current_stock / average_daily_sales

    def calculate_average_daily_sales(
        self, sales_records: List[SalesRecord], days: int = 30
    ) -> float:
        if not sales_records or days <= 0:
            return 0.0
        total_sales = sum(record.sales_quantity for record in sales_records)
        return total_sales / days

    def analyze_waste_trend(
        self, waste_records: List[WasteRecord], period_days: int = 7
    ) -> List[float]:
        if not waste_records:
            return []

        sorted_records = sorted(waste_records, key=lambda x: x.date)

        weekly_totals: List[float] = []
        current_week = 0
        current_total = 0.0

        for i, record in enumerate(sorted_records):
            current_total += record.waste_quantity
            current_week += 1

            if current_week >= period_days or i == len(sorted_records) - 1:
                weekly_totals.append(current_total)
                current_week = 0
                current_total = 0.0

        return weekly_totals[-4:] if len(weekly_totals) > 4 else weekly_totals

    def determine_severity(
        self,
        waste_rate: float,
        turnover_days: float,
        shelf_life_days: int,
    ) -> WasteSeverity:
        turnover_ratio = 1.0
        if shelf_life_days > 0 and not math.isinf(turnover_days):
            turnover_ratio = turnover_days / shelf_life_days

        if (
            waste_rate >= self.waste_rate_thresholds[WasteSeverity.CRITICAL]
            or (
                not math.isinf(turnover_days)
                and turnover_ratio >= self.turnover_threshold_ratio[WasteSeverity.CRITICAL]
            )
        ):
            return WasteSeverity.CRITICAL

        if (
            waste_rate >= self.waste_rate_thresholds[WasteSeverity.WARNING]
            or (
                not math.isinf(turnover_days)
                and turnover_ratio >= self.turnover_threshold_ratio[WasteSeverity.WARNING]
            )
        ):
            return WasteSeverity.WARNING

        if (
            waste_rate >= self.waste_rate_thresholds[WasteSeverity.ATTENTION]
            or (
                not math.isinf(turnover_days)
                and turnover_ratio >= self.turnover_threshold_ratio[WasteSeverity.ATTENTION]
            )
        ):
            return WasteSeverity.ATTENTION

        return WasteSeverity.NORMAL

    def identify_waste_reasons(
        self, waste_records: List[WasteRecord]
    ) -> List[str]:
        if not waste_records:
            return []

        reason_counts: Dict[str, int] = {}
        for record in waste_records:
            reason = record.waste_reason or "未标注原因"
            reason_counts[reason] = reason_counts.get(reason, 0) + 1

        sorted_reasons = sorted(
            reason_counts.items(), key=lambda x: x[1], reverse=True
        )
        return [reason for reason, count in sorted_reasons[:5]]

    def generate_suggestions(
        self,
        sku_analysis: SKUWasteAnalysis,
    ) -> List[str]:
        suggestions = []

        if sku_analysis.waste_rate >= 0.15:
            suggestions.append("损耗率极高，建议立即调整订货策略，大幅减少订货量")
        elif sku_analysis.waste_rate >= 0.08:
            suggestions.append("损耗率偏高，建议减少订货量，加强销售跟踪")

        if not math.isinf(sku_analysis.turnover_days):
            if sku_analysis.turnover_days > sku_analysis.shelf_life_days * 0.7:
                suggestions.append("库存周转天数接近保质期，存在较大过期风险")
            elif sku_analysis.turnover_days > sku_analysis.shelf_life_days * 0.5:
                suggestions.append("库存周转偏慢，建议优化库存水平")

        if "过期" in [r.lower() for r in sku_analysis.reasons]:
            suggestions.append("主要损耗原因为过期，建议缩短订货周期、减少单次订货量")

        if "滞销" in [r.lower() for r in sku_analysis.reasons]:
            suggestions.append("存在滞销情况，建议开展促销活动或优化陈列位置")

        if len(suggestions) == 0:
            suggestions.append("整体损耗控制良好，继续保持现有订货策略")

        return suggestions

    def analyze_sku_waste(
        self,
        sku_id: str,
        sku_name: str,
        category: str,
        waste_records: List[WasteRecord],
        sales_records: List[SalesRecord],
        current_stock: float,
        shelf_life_days: int,
        analysis_days: int = 30,
    ) -> SKUWasteAnalysis:
        total_waste_quantity = sum(r.waste_quantity for r in waste_records)
        total_waste_value = sum(r.waste_value for r in waste_records)
        total_sales_quantity = sum(r.sales_quantity for r in sales_records)

        waste_rate = self.calculate_waste_rate(
            total_waste_quantity, total_sales_quantity
        )

        average_daily_sales = self.calculate_average_daily_sales(
            sales_records, analysis_days
        )

        turnover_days = self.calculate_turnover_days(
            current_stock, average_daily_sales
        )

        waste_trend = self.analyze_waste_trend(waste_records)

        reasons = self.identify_waste_reasons(waste_records)

        severity = self.determine_severity(
            waste_rate, turnover_days, shelf_life_days
        )

        analysis = SKUWasteAnalysis(
            sku_id=sku_id,
            sku_name=sku_name,
            category=category,
            total_waste_quantity=round(total_waste_quantity, 2),
            total_waste_value=round(total_waste_value, 2),
            total_sales_quantity=round(total_sales_quantity, 2),
            waste_rate=round(waste_rate, 4),
            turnover_days=round(turnover_days, 2) if not math.isinf(turnover_days) else float("inf"),
            average_daily_sales=round(average_daily_sales, 2),
            current_stock=current_stock,
            shelf_life_days=shelf_life_days,
            severity=severity,
            waste_trend=[round(t, 2) for t in waste_trend],
            reasons=reasons,
        )

        analysis.suggestions = self.generate_suggestions(analysis)

        return analysis

    def analyze_store_waste(
        self,
        store_id: str,
        sku_data_list: List[Dict[str, Any]],
        analysis_days: int = 30,
        analysis_period: str = "",
    ) -> WasteAnalysisResult:
        high_waste_skus: List[SKUWasteAnalysis] = []
        total_waste_value = 0.0
        total_sales_value = 0.0
        total_sales_quantity = 0.0
        total_waste_quantity = 0.0

        category_breakdown: Dict[str, Dict[str, Any]] = {}

        for sku_data in sku_data_list:
            sku_id = sku_data["sku_id"]
            sku_name = sku_data.get("sku_name", sku_id)
            category = sku_data.get("category", "未分类")
            waste_records = sku_data.get("waste_records", [])
            sales_records = sku_data.get("sales_records", [])
            current_stock = sku_data.get("current_stock", 0.0)
            shelf_life_days = sku_data.get("shelf_life_days", 30)

            analysis = self.analyze_sku_waste(
                sku_id=sku_id,
                sku_name=sku_name,
                category=category,
                waste_records=waste_records,
                sales_records=sales_records,
                current_stock=current_stock,
                shelf_life_days=shelf_life_days,
                analysis_days=analysis_days,
            )

            if analysis.severity != WasteSeverity.NORMAL:
                high_waste_skus.append(analysis)

            total_waste_value += analysis.total_waste_value
            total_waste_quantity += analysis.total_waste_quantity
            total_sales_quantity += analysis.total_sales_quantity

            if category not in category_breakdown:
                category_breakdown[category] = {
                    "sku_count": 0,
                    "total_waste_value": 0.0,
                    "total_waste_quantity": 0.0,
                    "total_sales_quantity": 0.0,
                    "high_waste_count": 0,
                }

            category_breakdown[category]["sku_count"] += 1
            category_breakdown[category]["total_waste_value"] += analysis.total_waste_value
            category_breakdown[category]["total_waste_quantity"] += analysis.total_waste_quantity
            category_breakdown[category]["total_sales_quantity"] += analysis.total_sales_quantity

            if analysis.severity != WasteSeverity.NORMAL:
                category_breakdown[category]["high_waste_count"] += 1

        for category_data in category_breakdown.values():
            total = category_data["total_sales_quantity"] + category_data["total_waste_quantity"]
            if total > 0:
                category_data["waste_rate"] = round(
                    category_data["total_waste_quantity"] / total, 4
                )
            else:
                category_data["waste_rate"] = 0.0

        overall_waste_rate = self.calculate_waste_rate(
            total_waste_quantity, total_sales_quantity
        )

        high_waste_skus.sort(
            key=lambda x: (
                0 if x.severity == WasteSeverity.CRITICAL
                else 1 if x.severity == WasteSeverity.WARNING
                else 2 if x.severity == WasteSeverity.ATTENTION
                else 3,
                -x.total_waste_value,
            )
        )

        return WasteAnalysisResult(
            store_id=store_id,
            analysis_period=analysis_period,
            total_skus=len(sku_data_list),
            high_waste_skus=high_waste_skus,
            total_waste_value=round(total_waste_value, 2),
            overall_waste_rate=round(overall_waste_rate, 4),
            category_breakdown=category_breakdown,
        )

    def get_model_optimization_suggestions(
        self,
        waste_analysis_result: WasteAnalysisResult,
    ) -> List[Dict[str, Any]]:
        suggestions = []

        if waste_analysis_result.overall_waste_rate > 0.1:
            suggestions.append({
                "type": "forecast_model",
                "priority": "high",
                "suggestion": "整体损耗率偏高，建议优化预测模型，降低预测偏差",
                "action": "review_forecast_accuracy",
            })

        for category, data in waste_analysis_result.category_breakdown.items():
            if data.get("waste_rate", 0) > 0.15:
                suggestions.append({
                    "type": "category",
                    "priority": "high",
                    "category": category,
                    "suggestion": f"品类 {category} 损耗率过高，建议针对该品类调整安全系数",
                    "action": "adjust_safety_coefficient",
                })

        critical_skus = [
            sku for sku in waste_analysis_result.high_waste_skus
            if sku.severity == WasteSeverity.CRITICAL
        ]
        if len(critical_skus) >= 3:
            suggestions.append({
                "type": "sku",
                "priority": "high",
                "suggestion": f"有 {len(critical_skus)} 个SKU处于严重损耗状态，建议逐个分析优化",
                "action": "individual_sku_analysis",
            })

        slow_turnover = [
            sku for sku in waste_analysis_result.high_waste_skus
            if not math.isinf(sku.turnover_days)
            and sku.turnover_days > sku.shelf_life_days * 0.5
        ]
        if slow_turnover:
            suggestions.append({
                "type": "inventory",
                "priority": "medium",
                "suggestion": f"有 {len(slow_turnover)} 个SKU周转过慢，建议优化补货周期和安全库存",
                "action": "optimize_replenishment_cycle",
            })

        if len(suggestions) == 0:
            suggestions.append({
                "type": "general",
                "priority": "low",
                "suggestion": "当前损耗控制良好，建议保持现有策略并持续监控",
                "action": "maintain_status",
            })

        return suggestions

    def generate_waste_warning_list(
        self,
        waste_analysis_result: WasteAnalysisResult,
        min_severity: WasteSeverity = WasteSeverity.ATTENTION,
    ) -> List[Dict[str, Any]]:
        severity_order = {
            WasteSeverity.CRITICAL: 0,
            WasteSeverity.WARNING: 1,
            WasteSeverity.ATTENTION: 2,
            WasteSeverity.NORMAL: 3,
        }

        warning_list = []
        for sku in waste_analysis_result.high_waste_skus:
            if severity_order[sku.severity] <= severity_order[min_severity]:
                warning_list.append({
                    "sku_id": sku.sku_id,
                    "sku_name": sku.sku_name,
                    "category": sku.category,
                    "severity": sku.severity.value,
                    "waste_rate": sku.waste_rate,
                    "waste_value": sku.total_waste_value,
                    "turnover_days": sku.turnover_days,
                    "shelf_life_days": sku.shelf_life_days,
                    "top_reasons": sku.reasons[:3],
                    "primary_suggestion": sku.suggestions[0] if sku.suggestions else "",
                })

        return warning_list
