import React, { useState } from "react";
import {
    FaTimes, FaBold, FaItalic, FaStrikethrough, FaCode,
    FaAlignLeft, FaAlignCenter, FaAlignRight, FaAlignJustify
} from "react-icons/fa";
import {
    TbRowInsertBottom, TbColumnInsertRight,
    TbArrowBarUp, TbArrowBarDown, TbArrowBarLeft, TbArrowBarRight,
    TbTrash, TbTable, TbTextSize
} from "react-icons/tb";

interface SpreadsheetContextMenuProps {
    menuPosition: { x: number; y: number };
    onClose: () => void;
    hotTableRef: React.MutableRefObject<any>;
    selectedCell: { row: number, col: number } | null;
    updateAttributes: ((attrs: any) => void) | undefined;
    handleSort: (order: 'asc' | 'desc') => void;
    handleFormulaSubmit: (formula: string) => void;
    hasHeaderRow: boolean;
    hasHeaderColumn: boolean;
    toggleHeaderRow: () => void;
    toggleHeaderColumn: () => void;
    handleFormat: (type: string, value: any) => void;
}

export const SpreadsheetContextMenu: React.FC<SpreadsheetContextMenuProps> = ({
    menuPosition,
    onClose,
    hotTableRef,
    selectedCell,
    updateAttributes,
    handleSort,
    handleFormulaSubmit,
    hasHeaderRow,
    hasHeaderColumn,
    toggleHeaderRow,
    toggleHeaderColumn,
    handleFormat
}) => {
    const [showEditTableSubmenu, setShowEditTableSubmenu] = useState(false);
    const [showHeaderSubmenu, setShowHeaderSubmenu] = useState(false);
    const [showFormulaSubmenu, setShowFormulaSubmenu] = useState(false);
    const [showFormatSubmenu, setShowFormatSubmenu] = useState(false);

    // Color options
    // Color options
    const textColors = ['default', 'gray', 'red', 'orange', 'yellow', 'green', 'blue'];
    const bgColors = ['default', 'gray', 'red', 'orange', 'yellow', 'green', 'blue'];

    // Map for text color display in menu (matching CSS)
    const TEXT_COLOR_VALUES: Record<string, string> = {
        default: '#37352f',
        gray: '#555555',
        red: '#FF0000',
        orange: '#FF6600',
        yellow: '#E6B800',
        green: '#009900',
        blue: '#0000FF',
    };

    return (
        <>
            <div
                className="edit-menu-overlay"
                onClick={onClose}
            />
            <div
                className="edit-menu"
                style={{
                    position: 'fixed',
                    left: `${menuPosition.x}px`,
                    top: `${menuPosition.y}px`,
                    zIndex: 10000
                }}
            >
                {!showEditTableSubmenu && !showHeaderSubmenu && !showFormulaSubmenu && !showFormatSubmenu ? (
                    <>
                        {/* Main Menu */}
                        <button
                            onClick={() => setShowEditTableSubmenu(true)}
                            className="menu-item"
                        >
                            <span className="menu-item-content">
                                <span className="icon"><TbTable /></span> Edit Table
                            </span>
                            <span className="submenu-arrow">›</span>
                        </button>

                        <button
                            onClick={() => setShowHeaderSubmenu(true)}
                            className="menu-item"
                        >
                            <span className="menu-item-content">
                                <span className="icon">▭</span> Header
                            </span>
                            <span className="submenu-arrow">›</span>
                        </button>

                        <button
                            onClick={() => setShowFormatSubmenu(true)}
                            className="menu-item"
                        >
                            <span className="menu-item-content">
                                <span className="icon"><TbTextSize /></span> Format
                            </span>
                            <span className="submenu-arrow">›</span>
                        </button>

                        <div className="edit-menu-divider"></div>

                        <button
                            onClick={() => setShowFormulaSubmenu(true)}
                            className="menu-item"
                        >
                            <span className="menu-item-content">
                                <span className="icon">f(x)</span> Insert Formula
                            </span>
                            <span className="submenu-arrow">›</span>
                        </button>

                        <div className="edit-menu-divider"></div>

                        <button onClick={() => handleSort('asc')} className="menu-item">
                            <span className="menu-item-content">
                                Sort Ascending (1, 2, 3...)
                            </span>
                        </button>
                        <button onClick={() => handleSort('desc')} className="menu-item">
                            <span className="menu-item-content">
                                Sort Descending (3, 2, 1...)
                            </span>
                        </button>
                    </>
                ) : showEditTableSubmenu ? (
                    <>
                        {/* Edit Table Submenu */}
                        <div className="edit-menu-header">
                            <span>Edit Table</span>
                            <button
                                className="close-btn"
                                onClick={() => setShowEditTableSubmenu(false)}
                            >
                                <FaTimes />
                            </button>
                        </div>

                        <div className="edit-menu-divider"></div>

                        {/* Add Actions */}
                        <button
                            onClick={() => {
                                const hotInstance = (hotTableRef.current as any)?.hotInstance;
                                if (hotInstance) hotInstance.alter('insert_row_below');
                                onClose();
                            }}
                            className="menu-item"
                        >
                            <span className="menu-item-content">
                                <span className="icon"><TbRowInsertBottom /></span> Add Row
                            </span>
                        </button>

                        <button
                            onClick={() => {
                                const hotInstance = (hotTableRef.current as any)?.hotInstance;
                                if (hotInstance) hotInstance.alter('insert_col_end');
                                onClose();
                            }}
                            className="menu-item"
                        >
                            <span className="menu-item-content">
                                <span className="icon"><TbColumnInsertRight /></span> Add Column
                            </span>
                        </button>

                        <div className="edit-menu-divider"></div>

                        {/* Move Row Actions */}
                        <button
                            onClick={() => {
                                const hotInstance = (hotTableRef.current as any)?.hotInstance;
                                if (hotInstance && selectedCell && selectedCell.row > 0) {
                                    const data = hotInstance.getData();
                                    const newRow = selectedCell.row - 1;
                                    const temp = data[selectedCell.row];
                                    data[selectedCell.row] = data[newRow];
                                    data[newRow] = temp;

                                    hotInstance.loadData(data);
                                    if (updateAttributes) {
                                        updateAttributes({ data: JSON.stringify(data) });
                                    }
                                    hotInstance.selectCell(newRow, selectedCell.col);
                                }
                                onClose();
                            }}
                            className="menu-item"
                        >
                            <span className="menu-item-content">
                                <span className="icon"><TbArrowBarUp /></span> Move Row Up
                            </span>
                        </button>

                        <button
                            onClick={() => {
                                const hotInstance = (hotTableRef.current as any)?.hotInstance;
                                if (hotInstance && selectedCell) {
                                    const data = hotInstance.getData();
                                    if (selectedCell.row < data.length - 1) {
                                        const newRow = selectedCell.row + 1;
                                        const temp = data[selectedCell.row];
                                        data[selectedCell.row] = data[newRow];
                                        data[newRow] = temp;

                                        hotInstance.loadData(data);
                                        if (updateAttributes) {
                                            updateAttributes({ data: JSON.stringify(data) });
                                        }
                                        hotInstance.selectCell(newRow, selectedCell.col);
                                    }
                                }
                                onClose();
                            }}
                            className="menu-item"
                        >
                            <span className="menu-item-content">
                                <span className="icon"><TbArrowBarDown /></span> Move Row Down
                            </span>
                        </button>

                        {/* Move Column Actions */}
                        <button
                            onClick={() => {
                                const hotInstance = (hotTableRef.current as any)?.hotInstance;
                                if (hotInstance && selectedCell && selectedCell.col > 0) {
                                    const data = hotInstance.getData();
                                    const newCol = selectedCell.col - 1;

                                    for (let i = 0; i < data.length; i++) {
                                        const temp = data[i][selectedCell.col];
                                        data[i][selectedCell.col] = data[i][newCol];
                                        data[i][newCol] = temp;
                                    }

                                    hotInstance.loadData(data);
                                    if (updateAttributes) {
                                        updateAttributes({ data: JSON.stringify(data) });
                                    }
                                    hotInstance.selectCell(selectedCell.row, newCol);
                                }
                                onClose();
                            }}
                            className="menu-item"
                        >
                            <span className="menu-item-content">
                                <span className="icon"><TbArrowBarLeft /></span> Move Column Left
                            </span>
                        </button>

                        <button
                            onClick={() => {
                                const hotInstance = (hotTableRef.current as any)?.hotInstance;
                                if (hotInstance && selectedCell) {
                                    const data = hotInstance.getData();
                                    if (data.length > 0 && selectedCell.col < data[0].length - 1) {
                                        const newCol = selectedCell.col + 1;

                                        for (let i = 0; i < data.length; i++) {
                                            const temp = data[i][selectedCell.col];
                                            data[i][selectedCell.col] = data[i][newCol];
                                            data[i][newCol] = temp;
                                        }

                                        hotInstance.loadData(data);
                                        if (updateAttributes) {
                                            updateAttributes({ data: JSON.stringify(data) });
                                        }
                                        hotInstance.selectCell(selectedCell.row, newCol);
                                    }
                                }
                                onClose();
                            }}
                            className="menu-item"
                        >
                            <span className="menu-item-content">
                                <span className="icon"><TbArrowBarRight /></span> Move Column Right
                            </span>
                        </button>

                        <div className="edit-menu-divider"></div>

                        {/* Delete Actions */}
                        <button
                            onClick={() => {
                                const hotInstance = (hotTableRef.current as any)?.hotInstance;
                                if (hotInstance && selectedCell) {
                                    hotInstance.alter('remove_row', selectedCell.row);
                                }
                                onClose();
                            }}
                            className="menu-item delete"
                        >
                            <span className="menu-item-content">
                                <span className="icon"><TbTrash /></span> Delete Row
                            </span>
                        </button>

                        <button
                            onClick={() => {
                                const hotInstance = (hotTableRef.current as any)?.hotInstance;
                                if (hotInstance && selectedCell) {
                                    hotInstance.alter('remove_col', selectedCell.col);
                                }
                                onClose();
                            }}
                            className="menu-item delete"
                        >
                            <span className="menu-item-content">
                                <span className="icon"><TbTrash /></span> Delete Column
                            </span>
                        </button>
                    </>
                ) : showHeaderSubmenu ? (
                    <>
                        {/* Header Submenu */}
                        <div className="edit-menu-header">
                            <span>Header</span>
                            <button
                                className="close-btn"
                                onClick={() => setShowHeaderSubmenu(false)}
                            >
                                <FaTimes />
                            </button>
                        </div>

                        <div className="edit-menu-divider"></div>

                        <button
                            onClick={toggleHeaderRow}
                            className="menu-item toggle-item"
                        >
                            <span className="menu-item-content">
                                <span className="icon">▭</span> Header row
                            </span>
                            <div className={`toggle-switch ${hasHeaderRow ? 'active' : ''}`}>
                                <div className="toggle-slider"></div>
                            </div>
                        </button>

                        <button
                            onClick={toggleHeaderColumn}
                            className="menu-item toggle-item"
                        >
                            <span className="menu-item-content">
                                <span className="icon">▯</span> Header column
                            </span>
                            <div className={`toggle-switch ${hasHeaderColumn ? 'active' : ''}`}>
                                <div className="toggle-slider"></div>
                            </div>
                        </button>
                    </>
                ) : showFormatSubmenu ? (
                    <>
                        {/* Format Submenu */}
                        <div className="edit-menu-header">
                            <span>Format</span>
                            <button
                                className="close-btn"
                                onClick={() => setShowFormatSubmenu(false)}
                            >
                                <FaTimes />
                            </button>
                        </div>

                        <div className="edit-menu-divider"></div>

                        <div className="format-group">
                            <div className="format-group-label">Text Style</div>
                            <div className="format-controls-row">
                                <button className="format-btn" onClick={() => handleFormat('toggle', 'bold')}><FaBold /></button>
                                <button className="format-btn" onClick={() => handleFormat('toggle', 'italic')}><FaItalic /></button>
                                <button className="format-btn" onClick={() => handleFormat('toggle', 'strike')}><FaStrikethrough /></button>
                                <button className="format-btn" onClick={() => handleFormat('toggle', 'code')}><FaCode /></button>
                            </div>

                            <div className="format-controls-row">
                                <div className="format-btn-group">
                                    <button className="format-btn" onClick={() => handleFormat('align', 'left')}><FaAlignLeft /></button>
                                    <button className="format-btn" onClick={() => handleFormat('align', 'center')}><FaAlignCenter /></button>
                                    <button className="format-btn" onClick={() => handleFormat('align', 'right')}><FaAlignRight /></button>
                                    <button className="format-btn" onClick={() => handleFormat('align', 'justify')}><FaAlignJustify /></button>
                                </div>
                            </div>
                        </div>


                        <div className="edit-menu-divider"></div>

                        <div className="format-group">
                            <div className="format-group-label" style={{ marginBottom: '8px' }}>Text Color</div>

                            <div className="format-controls-row" style={{ flexWrap: 'wrap', gap: '8px', justifyContent: 'flex-start' }}>
                                {textColors.map(color => (
                                    <div
                                        key={color}
                                        className={`color-option htColor-${color}`}
                                        style={{
                                            backgroundColor: TEXT_COLOR_VALUES[color] || (color === 'default' ? '#37352f' : undefined),
                                            border: '1px solid rgba(0,0,0,0.1)'
                                        }}
                                        onClick={() => handleFormat('textColor', color)}
                                        title={color.charAt(0).toUpperCase() + color.slice(1)}
                                    />
                                ))}
                            </div>

                            <div className="edit-menu-divider" style={{ margin: '12px 0' }}></div>

                            <div className="format-group-label" style={{ marginBottom: '8px' }}>Background</div>
                            <div className="format-controls-row" style={{ flexWrap: 'wrap', gap: '8px', justifyContent: 'flex-start' }}>
                                {bgColors.map(color => (
                                    <div
                                        key={color}
                                        className={`color-option htBg-${color}`}
                                        style={{
                                            border: '1px solid rgba(0,0,0,0.1)',
                                            backgroundColor: color === 'default' ? 'transparent' : undefined
                                        }}
                                        onClick={() => handleFormat('backgroundColor', color)}
                                        title={color.charAt(0).toUpperCase() + color.slice(1)}
                                    >
                                        {color === 'default' && (
                                            <div style={{
                                                width: '100%', height: '100%',
                                                background: 'linear-gradient(45deg, transparent 48%, #d44c47 48%, #d44c47 52%, transparent 52%)',
                                                opacity: 0.5
                                            }} />
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                    </>
                ) : (
                    <>
                        {/* Formula Submenu */}
                        <div className="edit-menu-header">
                            <span>Insert Formula</span>
                            <button
                                className="close-btn"
                                onClick={() => setShowFormulaSubmenu(false)}
                            >
                                <FaTimes />
                            </button>
                        </div>
                        <div className="edit-menu-divider"></div>
                        <div style={{ padding: '8px' }}>
                            <div className="edit-menu-input-wrapper">
                                <span className="input-prefix">=</span>
                                <input
                                    type="text"
                                    className="edit-menu-input-field"
                                    placeholder="SUM(A1:B2)"
                                    autoFocus
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            const val = e.currentTarget.value;
                                            handleFormulaSubmit(val);
                                            onClose();
                                        }
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                />
                            </div>
                            <div className="edit-menu-hint">Example: SUM(A1:B2)</div>
                        </div>
                    </>
                )}
            </div>
        </>
    );
};
