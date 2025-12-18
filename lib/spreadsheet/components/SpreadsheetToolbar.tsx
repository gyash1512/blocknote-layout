import React, { useState } from "react";
import { FaTable, FaChartBar } from "react-icons/fa";

interface SpreadsheetToolbarProps {
    title: string;
    setTitle: (title: string) => void;
    onTitleBlur: () => void;
    mode: "table" | "chart";
    setMode: (mode: "table" | "chart") => void;
}

export const SpreadsheetToolbar: React.FC<SpreadsheetToolbarProps> = ({
    title,
    setTitle,
    onTitleBlur,
    mode,
    setMode
}) => {
    const [isEditing, setIsEditing] = useState(false);

    const handleBlur = () => {
        setIsEditing(false);
        onTitleBlur();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleBlur();
        }
    };

    return (
        <div className="spreadsheet-toolbar" contentEditable={false}>
            {isEditing ? (
                <input
                    className="spreadsheet-title-input"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    onBlur={handleBlur}
                    onKeyDown={handleKeyDown}
                    autoFocus
                />
            ) : (
                <div
                    className="spreadsheet-title"
                    onClick={() => setIsEditing(true)}
                    title="Click to edit title"
                >
                    {title}
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
    );
};
