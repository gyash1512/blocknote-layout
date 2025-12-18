import { NodeViewProps, NodeViewWrapper } from "@tiptap/react";
import React, { useRef, useCallback, useMemo, useState, useEffect } from "react";
import { HotTable } from "@handsontable/react";
import Handsontable from "handsontable";
import { registerAllModules } from "handsontable/registry";
import HyperFormula from 'hyperformula';
import "handsontable/styles/handsontable.css";
import "handsontable/styles/ht-theme-main.css";

import { SpreadsheetToolbar } from "./SpreadsheetToolbar";
import { SpreadsheetChart, ChartType } from "./SpreadsheetChart";
import { SpreadsheetContextMenu } from "./SpreadsheetContextMenu";

import "./styles.css";

// Register all Handsontable modules
registerAllModules();

// Define interface for the HotTable instance we expect
// We extend the unknown/generic component to include the property we access.
interface HotTableInstance {
    hotInstance: Handsontable;
}

export const SpreadsheetNodeView = (props: NodeViewProps) => {
    const { node, updateAttributes } = props;
    const [mode, setMode] = useState<'table' | 'chart'>("table");
    const [chartType, setChartType] = useState<ChartType>("pie");
    const [titleValue, setTitleValue] = useState(node.attrs.title || 'Untitled Spreadsheet');
    const [showEditMenu, setShowEditMenu] = useState(false);
    const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
    const [selectedCell, setSelectedCell] = useState<{ row: number, col: number } | null>(null);
    const [selectedRange, setSelectedRange] = useState<{ r1: number, c1: number, r2: number, c2: number } | null>(null);

    const [hasHeaderRow, setHasHeaderRow] = useState(false);
    const [hasHeaderColumn, setHasHeaderColumn] = useState(false);
    // Use React.ElementRef to get the correct instance type from the component
    // If that fails, we fallback to our custom interface.
    const hotTableRef = useRef<React.ElementRef<typeof HotTable>>(null);
    // Helper to get safe instance
    const getHotInstance = () => (hotTableRef.current as unknown as HotTableInstance)?.hotInstance;
    const lastSelectionRef = useRef<{ row: number, col: number, r2?: number, c2?: number } | null>(null);

    // Parse spreadsheet data from node.attrs
    const spreadsheetData = useMemo(() => {
        try {
            const parsed = typeof node.attrs.data === 'string' ? JSON.parse(node.attrs.data) : node.attrs.data;
            if (Array.isArray(parsed) && parsed.length > 0) {
                return parsed;
            }
            // Default 3x3 grid
            return [
                ['', '', ''],
                ['', '', ''],
                ['', '', '']
            ];
        } catch (e) {
            // Default 3x3 grid on error
            return [
                ['', '', ''],
                ['', '', ''],
                ['', '', '']
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

    // Parse cell metadata (styles)
    const cellMeta = useMemo(() => {
        try {
            console.log('SpreadsheetNodeView: parsing meta', node.attrs.meta);
            return typeof node.attrs.meta === 'string' ? JSON.parse(node.attrs.meta) : (node.attrs.meta || {});
        } catch (e) {
            console.error('SpreadsheetNodeView: error parsing meta', e);
            return {};
        }
    }, [node.attrs.meta]);

    // Initialize header states from settings
    useEffect(() => {
        try {
            const settings = JSON.parse(node.attrs.settings || '{}');
            if (settings.hasHeaderRow !== undefined) {
                setHasHeaderRow(settings.hasHeaderRow);
            }
            if (settings.hasHeaderColumn !== undefined) {
                setHasHeaderColumn(settings.hasHeaderColumn);
            }
        } catch (e) {
            // Ignore parse errors
        }
    }, [node.attrs.settings]);

    // define cell properties dynamically
    const cellSettings = useCallback((row: number, col: number) => {
        const cellProperties: any = {};
        const metaKey = `${row},${col}`;
        const meta = cellMeta[metaKey] || {};

        const classNames = [];
        if (hasHeaderRow && row === 0) {
            classNames.push('content-header-row');
        }
        if (hasHeaderColumn && col === 0) {
            classNames.push('content-header-col');
        }

        // Apply metadata styles
        if (meta.bold) classNames.push('htBold');
        if (meta.italic) classNames.push('htItalic');
        if (meta.strike) classNames.push('htStrike');
        if (meta.code) classNames.push('htCode');

        if (meta.align) {
            if (meta.align === 'left') classNames.push('htLeft');
            if (meta.align === 'center') classNames.push('htCenter');
            if (meta.align === 'right') classNames.push('htRight');
            if (meta.align === 'justify') classNames.push('htJustify');
        }

        if (meta.textColor) classNames.push(`htColor-${meta.textColor}`);
        if (meta.backgroundColor) classNames.push(`htBg-${meta.backgroundColor}`);

        if (classNames.length > 0) {
            cellProperties.className = classNames.join(' ');
        }

        // Apply cell format types (number, currency, etc)
        if (meta.format) {
            if (meta.format === 'number') {
                cellProperties.type = 'numeric';
                cellProperties.numericFormat = { pattern: '0,0.[0000]' };
            } else if (meta.format === 'currency') {
                cellProperties.type = 'numeric';
                cellProperties.numericFormat = { pattern: '$0,0.00' };
            } else if (meta.format === 'percent') {
                cellProperties.type = 'numeric';
                cellProperties.numericFormat = { pattern: '0%' };
            } else if (meta.format === 'date') {
                cellProperties.type = 'date';
                cellProperties.dateFormat = 'MM/DD/YYYY';
                cellProperties.correctFormat = true;
            } else if (meta.format === 'text') {
                cellProperties.type = 'text';
                cellProperties.numericFormat = undefined;
            }
        }

        return cellProperties;
    }, [hasHeaderRow, hasHeaderColumn, cellMeta]);

    // Handle formatting
    const handleFormat = useCallback((type: string, value: any) => {
        const range = selectedRange || (selectedCell ? { r1: selectedCell.row, c1: selectedCell.col, r2: selectedCell.row, c2: selectedCell.col } : null);

        if (range && updateAttributes) {
            const newMeta = { ...cellMeta };

            for (let r = range.r1; r <= range.r2; r++) {
                for (let c = range.c1; c <= range.c2; c++) {
                    const key = `${r},${c}`;
                    const current = newMeta[key] || {};

                    if (type === 'toggle') {
                        // Toggle boolean values like bold, italic
                        newMeta[key] = { ...current, [value]: !current[value] };
                    } else {
                        // Set value directly like align, color
                        newMeta[key] = { ...current, [type]: value };
                    }
                }
            }
            console.log('SpreadsheetNodeView: updating meta', newMeta);
            updateAttributes({ meta: JSON.stringify(newMeta) });

            // Force re-render of Handsontable
            const hotInstance = getHotInstance();
            if (hotInstance) hotInstance.render();
        }
    }, [selectedRange, selectedCell, cellMeta, updateAttributes]);

    // Handle changes from Handsontable
    const handleChange = useCallback((_changes: any, source: string) => {

        if (source === 'loadData') {
            return; // Don't save on initial load
        }

        const hotInstance = getHotInstance();
        if (hotInstance && updateAttributes) {
            const data = hotInstance.getData();
            updateAttributes({
                data: JSON.stringify(data),
            });
        }
    }, [updateAttributes]);

    // Handle cell selection
    const handleAfterSelection = useCallback((r: number, c: number, r2: number, c2: number) => {
        // Prevent infinite loop by checking if selection actually changed
        if (lastSelectionRef.current &&
            lastSelectionRef.current.row === r &&
            lastSelectionRef.current.col === c &&
            lastSelectionRef.current.r2 === r2 &&
            lastSelectionRef.current.c2 === c2) {
            return;
        }

        lastSelectionRef.current = { row: r, col: c, r2, c2 };
        setSelectedCell({ row: r, col: c });

        // Normalize range so r1 <= r2 and c1 <= c2
        setSelectedRange({
            r1: Math.min(r, r2),
            c1: Math.min(c, c2),
            r2: Math.max(r, r2),
            c2: Math.max(c, c2)
        });
    }, []);

    // Handle title blur
    const handleTitleBlur = useCallback(() => {
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

    // Toggle header row
    const toggleHeaderRow = useCallback(() => {
        const newValue = !hasHeaderRow;
        setHasHeaderRow(newValue);
        const settings = JSON.parse(node.attrs.settings || '{}');
        settings.hasHeaderRow = newValue;
        updateAttributes({ settings: JSON.stringify(settings) });
    }, [hasHeaderRow, node.attrs.settings, updateAttributes]);

    // Toggle header column
    const toggleHeaderColumn = useCallback(() => {
        const newValue = !hasHeaderColumn;
        setHasHeaderColumn(newValue);
        const settings = JSON.parse(node.attrs.settings || '{}');
        settings.hasHeaderColumn = newValue;
        updateAttributes({ settings: JSON.stringify(settings) });
    }, [hasHeaderColumn, node.attrs.settings, updateAttributes]);

    // Handle sorting with header awareness
    const handleSort = useCallback((order: 'asc' | 'desc') => {
        const hotInstance = getHotInstance();
        if (!hotInstance) return;

        const data = hotInstance.getData();
        if (!data || data.length === 0) return;

        // Separate header and data rows
        const startRow = hasHeaderRow ? 1 : 0;
        const headerRow = hasHeaderRow ? [data[0]] : [];
        const dataRows = data.slice(startRow);

        // Sort data rows
        const sortedData = dataRows.sort((a: any[], b: any[]) => {
            const aVal = a[0];
            const bVal = b[0];

            if (typeof aVal === 'number' && typeof bVal === 'number') {
                return order === 'asc' ? aVal - bVal : bVal - aVal;
            }

            const aStr = String(aVal || '');
            const bStr = String(bVal || '');
            return order === 'asc'
                ? aStr.localeCompare(bStr)
                : bStr.localeCompare(aStr);
        });

        // Combine header and sorted data
        const finalData = [...headerRow, ...sortedData];

        // Load sorted data
        hotInstance.loadData(finalData);

        // Update attributes
        updateAttributes({ data: JSON.stringify(finalData) });

        setShowEditMenu(false);
    }, [hasHeaderRow, updateAttributes]);

    // Handle context menu
    const handleContextMenu = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        const hotInstance = getHotInstance();
        if (hotInstance) {
            const selected = hotInstance.getSelected();
            if (selected && selected.length > 0) {
                const [row, col] = selected[0];
                setSelectedCell({ row, col });
            }
        }

        // Smart positioning to prevent overflow
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const menuWidth = 220; // Estimated width
        const menuHeight = 380; // Estimated max height (with submenu)

        let x = e.clientX;
        let y = e.clientY;

        // Flip left if close to right edge
        if (x + menuWidth > viewportWidth) {
            x = x - menuWidth;
        }

        // Flip up if close to bottom edge
        if (y + menuHeight > viewportHeight) {
            y = y - menuHeight;
        }

        setMenuPosition({ x, y });

        // Reset submenus handled in context menu component?
        // Actually the context menu component creates its own state for submenus.
        // We just show the main menu here.
        setShowEditMenu(true);
    }, []);

    // Handle formula submission
    const handleFormulaSubmit = (formulaInput: string) => {
        const hotInstance = getHotInstance();
        // Use selectedRange if available, otherwise fallback to selectedCell
        const range = selectedRange || (selectedCell ? { r1: selectedCell.row, c1: selectedCell.col, r2: selectedCell.row, c2: selectedCell.col } : null);

        if (hotInstance && range) {
            // Auto-prepend '=' if missing
            let formula = formulaInput.trim();
            if (!formula.startsWith('=')) {
                formula = '=' + formula;
            }

            // Apply to all cells in range
            for (let r = range.r1; r <= range.r2; r++) {
                for (let c = range.c1; c <= range.c2; c++) {
                    // Skip header row if enabled and we are on row 0
                    if (hasHeaderRow && r === 0) continue;
                    // Skip header column if enabled and we are on col 0
                    if (hasHeaderColumn && c === 0) continue;

                    hotInstance.setDataAtCell(r, c, formula);
                }
            }

            // Restore selection
            if (selectedCell) {
                hotInstance.selectCell(selectedCell.row, selectedCell.col, range.r2, range.c2);
            }
        }
    };

    // Load data into Handsontable when switching to table mode
    useEffect(() => {
        if (mode === 'table') {
            const hotInstance = getHotInstance();
            if (hotInstance && spreadsheetData) {
                hotInstance.loadData(spreadsheetData);
            }
        }
    }, [mode, spreadsheetData]);

    return (
        <NodeViewWrapper>
            <div className="spreadsheet-wrapper blocknote-spreadsheet" data-content-type="spreadsheet">
                <SpreadsheetToolbar
                    title={titleValue}
                    setTitle={setTitleValue}
                    onTitleBlur={handleTitleBlur}
                    mode={mode}
                    setMode={setMode}
                />

                <div className="spreadsheet-content" contentEditable={false}>
                    {mode === "table" ? (
                        <div className="handsontable-container" onContextMenu={handleContextMenu}>
                            <HotTable
                                // Safe cast compatible with the library's expectation
                                ref={hotTableRef as any}
                                data={useMemo(() => spreadsheetData, [])}
                                colHeaders={true}
                                rowHeaders={true}
                                width="100%"
                                height={tableHeight}
                                licenseKey="non-commercial-and-evaluation"
                                contextMenu={false}
                                manualColumnResize={true}
                                manualRowResize={true}
                                manualColumnMove={true}
                                manualRowMove={true}
                                copyPaste={true}
                                fillHandle={true}
                                undo={true}
                                formulas={{
                                    engine: HyperFormula,
                                }}
                                cells={cellSettings}
                                afterChange={handleChange}
                                afterSelectionEnd={handleAfterSelection}
                                afterRowMove={() => handleChange(null, 'move')}
                                afterColumnMove={() => handleChange(null, 'move')}
                                afterCreateRow={() => handleChange(null, 'create_row')}
                                afterRemoveRow={() => handleChange(null, 'remove_row')}
                                afterCreateCol={() => handleChange(null, 'create_col')}
                                afterRemoveCol={() => handleChange(null, 'remove_col')}
                                stretchH="all"
                                autoWrapRow={true}
                                autoWrapCol={true}
                            />
                        </div>
                    ) : (
                        <SpreadsheetChart
                            data={spreadsheetData}
                            chartType={chartType}
                            setChartType={setChartType}
                        />
                    )}
                </div>

                {/* Custom Context Menu */}
                {showEditMenu && (
                    <SpreadsheetContextMenu
                        menuPosition={menuPosition}
                        onClose={() => setShowEditMenu(false)}
                        hotTableRef={hotTableRef}
                        selectedCell={selectedCell}
                        updateAttributes={updateAttributes}
                        handleSort={handleSort}
                        handleFormulaSubmit={handleFormulaSubmit}
                        hasHeaderRow={hasHeaderRow}
                        hasHeaderColumn={hasHeaderColumn}
                        toggleHeaderRow={toggleHeaderRow}
                        toggleHeaderColumn={toggleHeaderColumn}
                        handleFormat={handleFormat}
                    />
                )}
            </div>
        </NodeViewWrapper>
    );
};

export default SpreadsheetNodeView;
