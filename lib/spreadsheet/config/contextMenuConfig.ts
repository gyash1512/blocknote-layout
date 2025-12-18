/**
 * Context Menu Configuration for Handsontable Spreadsheet
 * 
 * This file contains all context menu item definitions.
 * Add new menu items by adding entries to the appropriate section.
 * 
 * Menu structure inspired by Craft app for better organization.
 */

// Helper function to insert formula at selected cell
const insertFormula = (hotInstance: any, formula: string) => {
    const selected = hotInstance.getSelected();
    if (selected && selected.length > 0) {
        const [row, col] = selected[0];
        hotInstance.setDataAtCell(row, col, formula);
    }
};

// Helper function to sort column
const sortColumn = (hotInstance: any, order: 'asc' | 'desc') => {
    const selected = hotInstance.getSelected();
    if (selected && selected.length > 0) {
        const col = selected[0][1];
        const plugin = hotInstance.getPlugin('columnSorting');
        if (plugin) {
            plugin.sort({ column: col, sortOrder: order });
        }
    }
};

// Helper function to make row header (read-only)
const makeRowHeader = (hotInstance: any) => {
    const selected = hotInstance.getSelected();
    if (selected && selected.length > 0) {
        const row = selected[0][0];
        const colCount = hotInstance.countCols();
        for (let col = 0; col < colCount; col++) {
            hotInstance.setCellMeta(row, col, 'readOnly', true);
            hotInstance.setCellMeta(row, col, 'className', 'htHeader');
        }
        hotInstance.render();
    }
};

// Helper function to make row editable
const makeRowEditable = (hotInstance: any) => {
    const selected = hotInstance.getSelected();
    if (selected && selected.length > 0) {
        const row = selected[0][0];
        const colCount = hotInstance.countCols();
        for (let col = 0; col < colCount; col++) {
            hotInstance.removeCellMeta(row, col, 'readOnly');
            hotInstance.removeCellMeta(row, col, 'className');
        }
        hotInstance.render();
    }
};

/**
 * Formula menu items
 * Add new formulas here
 */
export const FORMULA_ITEMS = [
    {
        name: 'SUM',
        callback: function (this: any) {
            insertFormula(this, '=SUM()');
        }
    },
    {
        name: 'AVERAGE',
        callback: function (this: any) {
            insertFormula(this, '=AVERAGE()');
        }
    },
    {
        name: 'COUNT',
        callback: function (this: any) {
            insertFormula(this, '=COUNT()');
        }
    },
    {
        name: 'MIN',
        callback: function (this: any) {
            insertFormula(this, '=MIN()');
        }
    },
    {
        name: 'MAX',
        callback: function (this: any) {
            insertFormula(this, '=MAX()');
        }
    }
];

/**
 * Main context menu configuration
 * Organized like Craft app for better UX
 */
export const getContextMenuConfig = () => ({
    items: {
        // ========== EDIT TABLE SUBMENU ==========
        'edit_table': {
            name: 'Edit Table',
            submenu: {
                items: [
                    {
                        name: 'Insert row above',
                        callback: function (this: any) {
                            try {
                                const selected = this.getSelected();
                                if (selected && selected.length > 0) {
                                    const row = selected[0][0];
                                    this.alter('insert_row_above', row, 1);
                                }
                            } catch (error) {
                                console.error('Error inserting row above:', error);
                            }
                        }
                    },
                    {
                        name: 'Insert row below',
                        callback: function (this: any) {
                            try {
                                const selected = this.getSelected();
                                if (selected && selected.length > 0) {
                                    const row = selected[0][0];
                                    this.alter('insert_row_below', row, 1);
                                }
                            } catch (error) {
                                console.error('Error inserting row below:', error);
                            }
                        }
                    },
                    {
                        name: 'Insert column left',
                        callback: function (this: any) {
                            try {
                                const selected = this.getSelected();
                                if (selected && selected.length > 0) {
                                    const col = selected[0][1];
                                    this.alter('insert_col_start', col, 1);
                                }
                            } catch (error) {
                                console.error('Error inserting column left:', error);
                            }
                        }
                    },
                    {
                        name: 'Insert column right',
                        callback: function (this: any) {
                            try {
                                const selected = this.getSelected();
                                if (selected && selected.length > 0) {
                                    const col = selected[0][1];
                                    this.alter('insert_col_end', col, 1);
                                }
                            } catch (error) {
                                console.error('Error inserting column right:', error);
                            }
                        }
                    },
                    '---------',
                    {
                        name: 'Delete row',
                        callback: function (this: any) {
                            try {
                                const selected = this.getSelected();
                                if (selected && selected.length > 0) {
                                    const row = selected[0][0];
                                    this.alter('remove_row', row, 1);
                                }
                            } catch (error) {
                                console.error('Error deleting row:', error);
                            }
                        }
                    },
                    {
                        name: 'Delete column',
                        callback: function (this: any) {
                            try {
                                const selected = this.getSelected();
                                if (selected && selected.length > 0) {
                                    const col = selected[0][1];
                                    this.alter('remove_col', col, 1);
                                }
                            } catch (error) {
                                console.error('Error deleting column:', error);
                            }
                        }
                    }
                ]
            }
        },

        // ========== HEADER SUBMENU ==========
        'header': {
            name: 'Header',
            submenu: {
                items: [
                    {
                        name: 'Make row header (read-only)',
                        callback: function (this: any) {
                            try {
                                makeRowHeader(this);
                            } catch (error) {
                                console.error('Error making row header:', error);
                            }
                        }
                    },
                    {
                        name: 'Make row editable',
                        callback: function (this: any) {
                            try {
                                makeRowEditable(this);
                            } catch (error) {
                                console.error('Error making row editable:', error);
                            }
                        }
                    }
                ]
            }
        },

        'sp1': { name: '---------' },

        // ========== INSERT FORMULA SUBMENU ==========
        'insert_formula': {
            name: 'Insert Formula',
            submenu: {
                items: FORMULA_ITEMS
            }
        },

        'sp2': { name: '---------' },

        // ========== SORTING (DIRECT ITEMS) ==========
        'sort_asc': {
            name: 'Sort Ascending (1, 2, 3...)',
            callback: function (this: any) {
                try {
                    sortColumn(this, 'asc');
                } catch (error) {
                    console.error('Error sorting ascending:', error);
                }
            }
        },
        'sort_desc': {
            name: 'Sort Descending (3, 2, 1...)',
            callback: function (this: any) {
                try {
                    sortColumn(this, 'desc');
                } catch (error) {
                    console.error('Error sorting descending:', error);
                }
            }
        }
    }
}) as any; // Type assertion to work around Handsontable's strict typing

/**
 * Column dropdown menu configuration
 */
export const COLUMN_DROPDOWN_CONFIG = [
    'filter_by_condition',
    'filter_operators',
    'filter_by_condition2',
    'filter_by_value',
    'filter_action_bar',
    { name: '---------' },
    'alignment',
] as any; // Type assertion to work around Handsontable's strict typing

/**
 * Column sorting configuration
 */
export const COLUMN_SORTING_CONFIG = {
    headerAction: true,
    sortEmptyCells: true,
    indicator: true,
    compareFunctionFactory: function (sortOrder: string) {
        return function (value: any, nextValue: any) {
            if (sortOrder === 'asc') {
                return value > nextValue ? 1 : value < nextValue ? -1 : 0;
            } else {
                return value < nextValue ? 1 : value > nextValue ? -1 : 0;
            }
        };
    }
};
