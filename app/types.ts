export type WidgetType = 'time' | 'date' | 'todo' | 'todoist' | 'youtube' | 'pomodoro' | 'weather' | 'spotify' | 'spotify_hidden' | 'waterlog' | 'spacer' | 'telegram' | 'tab';

export interface Widget {
    id: string;
    type: WidgetType;
    positionPreference?: 'top' | 'middle' | 'bottom' | 'auto'; // Only used if it's the only widget in the column
    customHeight?: number; // Percentage
    settings?: Record<string, any>;
}

export type ColumnId = 'left' | 'middle' | 'right';

export interface AppState {
    columns: {
        [key in ColumnId]: Widget[];
    };
    columnWidths: {
        [key in ColumnId]: number; // Percentage 0-100
    };
    background: {
        activeType: 'solid' | 'image';
        imageValue: string;
        colorValue: string;
        fontColorValue?: string;
        textBorderColorValue?: string;
    };
    blur?: number; // 0-100
    isEditing: boolean;
    maxWidgetsPerColumn?: number;
    wakeLock?: boolean;
}
