import React, { useMemo, useCallback } from "react";
import ReactECharts from 'echarts-for-react';
import { FaChartBar, FaChartLine, FaChartPie, FaChartArea } from "react-icons/fa";

export type ChartType = "bar" | "line" | "pie" | "area";

interface SpreadsheetChartProps {
    data: any[][];
    chartType: ChartType;
    setChartType: (type: ChartType) => void;
}

export const SpreadsheetChart: React.FC<SpreadsheetChartProps> = ({
    data: spreadsheetData,
    chartType,
    setChartType
}) => {
    // Extract chart data from the spreadsheet
    const chartData = useMemo(() => {
        if (!spreadsheetData || spreadsheetData.length < 2) return { categories: [], series: [] };

        const headers = spreadsheetData[0];
        const rows = spreadsheetData.slice(1);

        const categories = rows.map((row: any[]) => String(row[0] || ''));
        const seriesData: any[] = [];

        // Process each column (skip first column which is categories)
        for (let colIdx = 1; colIdx < headers.length; colIdx++) {
            const columnName = String(headers[colIdx]);
            const values = rows.map((row: any[]) => {
                const val = row[colIdx];
                return typeof val === 'number' ? val : (val && !isNaN(Number(val)) ? Number(val) : 0);
            });

            // Only include if at least one value is numeric
            if (values.some(v => v !== 0)) {
                seriesData.push({
                    name: columnName,
                    data: values,
                });
            }
        }

        return { categories, series: seriesData };
    }, [spreadsheetData]);

    // ECharts configuration with professional colors and interactivity
    const getEChartsOption = useCallback(() => {
        const { categories, series } = chartData;

        if (series.length === 0) {
            return null;
        }

        const colors = ['#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de', '#3ba272', '#fc8452', '#9a60b4'];

        switch (chartType) {
            case "line":
                return {
                    color: colors,
                    tooltip: {
                        trigger: 'axis',
                        axisPointer: { type: 'cross' }
                    },
                    legend: {
                        data: series.map((s: any) => s.name),
                        bottom: 0,
                    },
                    grid: {
                        left: '3%',
                        right: '4%',
                        bottom: '15%',
                        containLabel: true
                    },
                    toolbox: {
                        feature: {
                            saveAsImage: { title: 'Save' },
                        }
                    },
                    xAxis: {
                        type: 'category',
                        data: categories,
                        boundaryGap: false,
                    },
                    yAxis: { type: 'value' },
                    dataZoom: [
                        { type: 'inside', start: 0, end: 100 },
                        { start: 0, end: 100 }
                    ],
                    series: series.map((s: any) => ({
                        name: s.name,
                        type: 'line',
                        data: s.data,
                        smooth: true,
                        emphasis: { focus: 'series' }
                    }))
                };

            case "area":
                return {
                    color: colors,
                    tooltip: {
                        trigger: 'axis',
                        axisPointer: { type: 'cross' }
                    },
                    legend: {
                        data: series.map((s: any) => s.name),
                        bottom: 0,
                    },
                    grid: {
                        left: '3%',
                        right: '4%',
                        bottom: '15%',
                        containLabel: true
                    },
                    toolbox: {
                        feature: {
                            saveAsImage: { title: 'Save' },
                        }
                    },
                    xAxis: {
                        type: 'category',
                        data: categories,
                        boundaryGap: false,
                    },
                    yAxis: { type: 'value' },
                    dataZoom: [
                        { type: 'inside', start: 0, end: 100 },
                        { start: 0, end: 100 }
                    ],
                    series: series.map((s: any) => ({
                        name: s.name,
                        type: 'line',
                        data: s.data,
                        smooth: true,
                        areaStyle: {},
                        emphasis: { focus: 'series' }
                    }))
                };

            case "pie":
                // For pie chart, use first series only
                const pieData = categories.map((name: string, idx: number) => ({
                    name,
                    value: series[0]?.data[idx] || 0
                })).filter((d: any) => d.value > 0);

                return {
                    color: colors,
                    tooltip: {
                        trigger: 'item',
                        formatter: '{b}: {c} ({d}%)'
                    },
                    legend: {
                        orient: 'vertical',
                        left: 'left',
                    },
                    toolbox: {
                        feature: {
                            saveAsImage: { title: 'Save' },
                        }
                    },
                    series: [{
                        name: series[0]?.name || 'Data',
                        type: 'pie',
                        radius: ['40%', '70%'],
                        avoidLabelOverlap: true,
                        itemStyle: {
                            borderRadius: 10,
                            borderColor: '#fff',
                            borderWidth: 2
                        },
                        label: {
                            show: true,
                            formatter: '{b}: {d}%'
                        },
                        emphasis: {
                            label: {
                                show: true,
                                fontSize: 16,
                                fontWeight: 'bold'
                            }
                        },
                        data: pieData
                    }]
                };

            case "bar":
            default:
                return {
                    color: colors,
                    tooltip: {
                        trigger: 'axis',
                        axisPointer: { type: 'shadow' }
                    },
                    legend: {
                        data: series.map((s: any) => s.name),
                        bottom: 0,
                    },
                    grid: {
                        left: '3%',
                        right: '4%',
                        bottom: '15%',
                        containLabel: true
                    },
                    toolbox: {
                        feature: {
                            saveAsImage: { title: 'Save' },
                        }
                    },
                    xAxis: {
                        type: 'category',
                        data: categories,
                    },
                    yAxis: { type: 'value' },
                    dataZoom: [
                        { type: 'inside', start: 0, end: 100 },
                        { start: 0, end: 100 }
                    ],
                    series: series.map((s: any) => ({
                        name: s.name,
                        type: 'bar',
                        data: s.data,
                        emphasis: { focus: 'series' }
                    }))
                };
        }
    }, [chartData, chartType]);

    const option = getEChartsOption();

    if (!option) {
        return <div className="chart-empty">No data to visualize. Add numeric data in Table mode.</div>;
    }

    return (
        <div className="spreadsheet-chart-wrapper">
            <div className="chart-controls">
                <button
                    onClick={() => setChartType("bar")}
                    className={chartType === "bar" ? "active" : ""}
                    title="Bar Chart"
                >
                    <FaChartBar />
                </button>
                <button
                    onClick={() => setChartType("line")}
                    className={chartType === "line" ? "active" : ""}
                    title="Line Chart"
                >
                    <FaChartLine />
                </button>
                <button
                    onClick={() => setChartType("area")}
                    className={chartType === "area" ? "active" : ""}
                    title="Area Chart"
                >
                    <FaChartArea />
                </button>
                <button
                    onClick={() => setChartType("pie")}
                    className={chartType === "pie" ? "active" : ""}
                    title="Pie Chart"
                >
                    <FaChartPie />
                </button>
            </div>
            <div className="spreadsheet-chart-container">
                <ReactECharts
                    key={`chart-${chartType}`}
                    option={option}
                    style={{ height: '450px', width: '100%' }}
                    opts={{ renderer: 'svg' }}
                    notMerge={true}
                />
            </div>
        </div>
    );
};
