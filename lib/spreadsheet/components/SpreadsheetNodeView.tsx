import { NodeViewProps, NodeViewWrapper } from "@tiptap/react";
import React, { useRef, useCallback, useMemo, useState } from "react";
import { HotTable } from "@handsontable/react";
import { registerAllModules } from "handsontable/registry";
import HyperFormula from 'hyperformula';
import "handsontable/styles/handsontable.css";
import "handsontable/styles/ht-theme-main.css";
import ReactECharts from 'echarts-for-react';
import {
    FaTable, FaChartBar, FaChartLine, FaChartPie, FaChartArea
} from "react-icons/fa";

import "./styles.css";

// Register all Handsontable modules
registerAllModules();

// Chart type options
type ChartType = "bar" | "line" | "pie" | "area";

const SpreadsheetNodeView: React.FC<NodeViewProps> = ({ node, updateAttributes }) => {
    const [mode, setMode] = useState<"table" | "chart">("table");
    const [chartType, setChartType] = useState<ChartType>("pie");
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [titleValue, setTitleValue] = useState(node.attrs.title);
    const hotTableRef = useRef(null);

    // Parse spreadsheet data from node.attrs
    const spreadsheetData = useMemo(() => {
        try {
            const parsed = typeof node.attrs.data === 'string' ? JSON.parse(node.attrs.data) : node.attrs.data;
            if (Array.isArray(parsed) && parsed.length > 0) {
                return parsed;
            }
            // Default empty spreadsheet with headers
            return [
                ["Name", "Q1", "Q2", "Q3", "Total"],
                ["Product A", 10, 15, 20, "=SUM(B2:D2)"],
                ["Product B", 20, 25, 30, "=SUM(B3:D3)"],
                ["Product C", 30, 35, 40, "=SUM(B4:D4)"],
            ];
        } catch {
            return [
                ["Column 1", "Column 2", "Column 3"],
                ["", "", ""],
            ];
        }
    }, [node.attrs.data]);

    // Calculate dynamic height based on number of rows
    const tableHeight = useMemo(() => {
        const rowCount = spreadsheetData.length;
        const headerHeight = 25;
        const rowHeight = 23;
        const minHeight = 200;
        const maxHeight = 600;

        const calculatedHeight = headerHeight + (rowCount * rowHeight) + 50; // 50px for padding
        return Math.min(Math.max(calculatedHeight, minHeight), maxHeight);
    }, [spreadsheetData]);

    // Handle changes from Handsontable
    const handleChange = useCallback((_changes: any, source: string) => {

        if (source === 'loadData') {
            return; // Don't save on initial load
        }

        const hotInstance = (hotTableRef.current as any)?.hotInstance;
        if (hotInstance && updateAttributes) {
            const data = hotInstance.getData();
            updateAttributes({
                data: JSON.stringify(data),
            });
        }
    }, [updateAttributes]);

    // Additional save on blur to catch any missed changes
    const handleAfterSelection = useCallback(() => {
        const hotInstance = (hotTableRef.current as any)?.hotInstance;
        if (hotInstance && updateAttributes) {
            const data = hotInstance.getData();
            updateAttributes({
                data: JSON.stringify(data),
            });
        }
    }, [updateAttributes]);

    // Handle title blur
    const handleTitleBlur = useCallback(() => {
        setIsEditingTitle(false);
        if (titleValue.trim() === '') {
            const defaultTitle = 'Untitled Spreadsheet';
            setTitleValue(defaultTitle);
            if (updateAttributes) {
                updateAttributes({ title: defaultTitle });
            }
        } else if (updateAttributes) {
            updateAttributes({ title: titleValue });
        }
    }, [titleValue, updateAttributes]);

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

    // Chart Component with ECharts
    const ChartComponent = () => {
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

    // Load data into Handsontable when switching to table mode
    React.useEffect(() => {
        if (mode === 'table') {
            const hotInstance = (hotTableRef.current as any)?.hotInstance;
            if (hotInstance && spreadsheetData) {
                hotInstance.loadData(spreadsheetData);
            }
        }
    }, [mode, spreadsheetData]);

    return (
        <NodeViewWrapper>
            <div className="spreadsheet-wrapper blocknote-spreadsheet" data-content-type="spreadsheet">
                <div className="spreadsheet-toolbar" contentEditable={false}>
                    {isEditingTitle ? (
                        <input
                            className="spreadsheet-title-input"
                            value={titleValue}
                            onChange={(e) => setTitleValue(e.target.value)}
                            onBlur={handleTitleBlur}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    handleTitleBlur();
                                }
                            }}
                            autoFocus
                        />
                    ) : (
                        <div
                            className="spreadsheet-title"
                            onClick={() => setIsEditingTitle(true)}
                            title="Click to edit title"
                        >
                            {titleValue}
                        </div>
                    )}
                    <div className="spreadsheet-actions">
                        <button onClick={() => setMode("table")} className={mode === "table" ? "active" : ""}>
                            <FaTable /> Table
                        </button>
                        <button onClick={() => setMode("chart")} className={mode === "chart" ? "active" : ""}>
                            <FaChartBar /> Chart
                        </button>
                    </div>
                </div>

                <div className="spreadsheet-content" contentEditable={false}>
                    {mode === "table" ? (
                        <div className="handsontable-container">
                            <HotTable
                                ref={hotTableRef}
                                data={spreadsheetData}
                                colHeaders={true}
                                rowHeaders={true}
                                width="100%"
                                height={tableHeight}
                                licenseKey="non-commercial-and-evaluation"
                                // Enable all Handsontable features:
                                contextMenu={true} // Right-click menu with add/remove rows/columns
                                manualColumnResize={true}
                                manualRowResize={true}
                                manualColumnMove={true}
                                manualRowMove={true}
                                copyPaste={true}
                                fillHandle={true}
                                undo={true}
                                search={true}
                                filters={true}
                                dropdownMenu={true}
                                // Formula support via HyperFormula
                                formulas={{
                                    engine: HyperFormula,
                                }}
                                afterChange={handleChange}
                                afterSelectionEnd={handleAfterSelection}
                                // Additional settings for better UX
                                stretchH="all"
                                autoWrapRow={true}
                                autoWrapCol={true}
                            />
                        </div>
                    ) : (
                        <ChartComponent />
                    )}
                </div>
            </div>
        </NodeViewWrapper>
    );
};

export default SpreadsheetNodeView;
