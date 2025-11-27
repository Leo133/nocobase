# MCIT Data Editor Plugin

A NocoDB-style spreadsheet editor for NocoBase that provides an intuitive interface for editing, creating, and managing records across all data sources.

## Features

### Core Features
- **Inline Cell Editing**: Click any cell to edit directly with auto-save functionality
- **Multiple View Types**: 
  - Grid View (spreadsheet-style table)
  - Form View (detailed record editing)
  - Kanban View (card-based grouping)
  - Calendar View (date-based visualization)
  - Gallery View (image-centric layout)

### Data Operations
- **CRUD Operations**: Create, read, update, and delete records seamlessly
- **Bulk Operations**: Multi-select rows for batch delete, duplicate, or export
- **Row Duplication**: Quickly create copies of existing records
- **Keyboard Navigation**: Use Tab, Enter, and Escape keys for efficient editing

### Data Management
- **Filtering**: Advanced filter builder for complex queries
- **Sorting**: Single and multi-column sorting
- **Search**: Global search across all text fields
- **Pagination**: Configurable page sizes (20, 50, 100, 200 records)

### Column Management
- **Show/Hide Fields**: Toggle visibility of individual columns
- **Column Reordering**: Drag and drop to rearrange columns
- **Column Resizing**: Adjust column widths as needed
- **Field Type Support**: All NocoBase field types are supported

### Integration
- **Full NocoBase Integration**: Works with all NocoBase data sources
- **ACL Support**: Respects NocoBase's permission system
- **Multi-Data Source**: Connect to main database and external data sources

## Installation

The plugin is included in NocoBase's plugin ecosystem. Enable it through the Plugin Manager.

## Usage

1. Navigate to **Settings > MCIT Data Editor** in the NocoBase admin panel
2. Select a data source and collection to edit
3. Start editing cells directly by clicking on them
4. Use the toolbar for filtering, sorting, and adding new rows
5. Switch between view types using the tabs above the data grid

## API

### Server-side

The plugin registers the following resources:

- `mcitViews`: Manages custom view configurations
  - `list`: Get all views for a collection
  - `create`: Create a new view
  - `update`: Update an existing view
  - `destroy`: Delete a view

### Client-side

The plugin exports:

- `MCITSpreadsheetBlockModel`: Flow engine model for the spreadsheet block
- `MCITSpreadsheetEditor`: React component for the spreadsheet editor
- `MCITDataEditorPage`: Collection browser and selection page

## Configuration

Views can be customized with:

```typescript
interface MCITViewConfig {
  key: string;
  title: string;
  type: 'grid' | 'form' | 'kanban' | 'calendar' | 'gallery';
  columns: MCITColumnConfig[];
  filters: MCITFilterConfig[];
  sorts: MCITSortConfig[];
  groupBy?: string;
  isDefault?: boolean;
}
```

## Future Roadmap

- [ ] Kanban view implementation
- [ ] Calendar view implementation
- [ ] Gallery view implementation
- [ ] Advanced formula fields
- [ ] Row grouping and sub-totals
- [ ] Conditional formatting
- [ ] Data validation rules
- [ ] Collaborative editing
- [ ] Undo/Redo support
- [ ] Keyboard shortcuts customization
- [ ] Export to Excel/CSV
- [ ] Import from Excel/CSV
- [ ] Record linking (relationships)
- [ ] Lookup and rollup fields

## License

This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
