import { useState } from "react";
import { useHistory, TranscriptionEntry } from "@/lib/history-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog";
import { IconTrash, IconHistory, IconSettings, IconChevronUp, IconChevronDown, IconSelector, IconEye, IconChevronLeft, IconChevronRight, IconChevronsLeft, IconChevronsRight } from "@tabler/icons-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate } from "react-router-dom";

function formatDate(timestamp: number): string {
    const date = new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDuration(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
}

type SortField = 'timestamp' | 'duration_ms' | 'word_count' | 'char_count' | 'shortcut_used' | 'target_app';
type SortDirection = 'asc' | 'desc';

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

export default function TranscriptionHistory() {
    const { entries, isLoading, settings, deleteEntry } = useHistory();
    const navigate = useNavigate();
    const [sortField, setSortField] = useState<SortField>('timestamp');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
    const [selectedEntry, setSelectedEntry] = useState<TranscriptionEntry | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('desc');
        }
        // Reset to first page when sorting changes
        setCurrentPage(1);
    };

    const handleDelete = async (id: string) => {
        if (confirm('Delete this transcription entry?')) {
            await deleteEntry(id);
        }
    };

    // Sort entries
    const sortedEntries = [...entries].sort((a, b) => {
        let aVal: string | number = a[sortField] ?? '';
        let bVal: string | number = b[sortField] ?? '';

        if (typeof aVal === 'string') aVal = aVal.toLowerCase();
        if (typeof bVal === 'string') bVal = bVal.toLowerCase();

        if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
        return 0;
    });

    // Pagination
    const totalPages = Math.ceil(sortedEntries.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedEntries = sortedEntries.slice(startIndex, endIndex);

    const goToFirstPage = () => setCurrentPage(1);
    const goToPreviousPage = () => setCurrentPage(p => Math.max(1, p - 1));
    const goToNextPage = () => setCurrentPage(p => Math.min(totalPages, p + 1));
    const goToLastPage = () => setCurrentPage(totalPages);

    const handlePageSizeChange = (value: string) => {
        setItemsPerPage(Number(value));
        setCurrentPage(1); // Reset to first page when changing page size
    };

    const SortIcon = ({ field }: { field: SortField }) => {
        if (sortField !== field) return <IconSelector className="h-4 w-4 opacity-50" />;
        return sortDirection === 'asc'
            ? <IconChevronUp className="h-4 w-4" />
            : <IconChevronDown className="h-4 w-4" />;
    };

    const SortableHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
        <th
            className="h-10 px-4 text-left align-middle font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors select-none"
            onClick={() => handleSort(field)}
        >
            <div className="flex items-center gap-1">
                {children}
                <SortIcon field={field} />
            </div>
        </th>
    );

    if (isLoading) {
        return (
            <div className="flex flex-col gap-4 p-4 md:p-6">
                <div className="flex flex-col gap-1">
                    <h1 className="text-2xl font-semibold">Transcription History</h1>
                    <p className="text-muted-foreground">Loading...</p>
                </div>
            </div>
        );
    }

    if (!settings.enabled) {
        return (
            <div className="flex flex-col gap-4 p-4 md:p-6">
                <div className="flex flex-col gap-1">
                    <h1 className="text-2xl font-semibold">Transcription History</h1>
                    <p className="text-muted-foreground">History is disabled</p>
                </div>
                <Card className="max-w-md">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <IconHistory className="h-5 w-5" />
                            History Disabled
                        </CardTitle>
                        <CardDescription>
                            Transcription history is currently disabled in your settings.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button onClick={() => navigate('/preferences')}>
                            <IconSettings className="mr-2 h-4 w-4" />
                            Go to Settings
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (entries.length === 0) {
        return (
            <div className="flex flex-col gap-4 p-4 md:p-6">
                <div className="flex flex-col gap-1">
                    <h1 className="text-2xl font-semibold">Transcription History</h1>
                    <p className="text-muted-foreground">No transcriptions yet</p>
                </div>
                <Card className="max-w-md">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <IconHistory className="h-5 w-5" />
                            No History Yet
                        </CardTitle>
                        <CardDescription>
                            Start speaking to create transcription entries. Hold Right Ctrl to begin.
                        </CardDescription>
                    </CardHeader>
                </Card>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4 p-4 md:p-6">
            <div className="flex flex-col gap-1">
                <h1 className="text-2xl font-semibold">Transcription History</h1>
                <p className="text-muted-foreground">
                    {entries.length} transcription{entries.length !== 1 ? 's' : ''} saved
                </p>
            </div>

            <div className="rounded-md border overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b bg-muted/50">
                            <SortableHeader field="timestamp">Date/Time</SortableHeader>
                            <SortableHeader field="duration_ms">Duration</SortableHeader>
                            <SortableHeader field="word_count">Words</SortableHeader>
                            <SortableHeader field="char_count">Chars</SortableHeader>
                            {settings.save_full_text && (
                                <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Text</th>
                            )}
                            <SortableHeader field="shortcut_used">Shortcut</SortableHeader>
                            <SortableHeader field="target_app">App</SortableHeader>
                            <th className="h-10 px-4 text-right align-middle font-medium text-muted-foreground">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedEntries.map((entry) => (
                            <tr key={entry.id} className="border-b transition-colors hover:bg-muted/50">
                                <td className="p-4 align-middle text-sm whitespace-nowrap">
                                    {formatDate(entry.timestamp)}
                                </td>
                                <td className="p-4 align-middle text-sm">
                                    {formatDuration(entry.duration_ms)}
                                </td>
                                <td className="p-4 align-middle text-sm font-medium">
                                    {entry.word_count}
                                </td>
                                <td className="p-4 align-middle text-sm">
                                    {entry.char_count}
                                </td>
                                {settings.save_full_text && (
                                    <td className="p-4 align-middle text-sm max-w-[200px]">
                                        {entry.text ? (
                                            <div className="flex items-center gap-2">
                                                <span className="truncate">{entry.text.substring(0, 40)}{entry.text.length > 40 ? '...' : ''}</span>
                                                {entry.text.length > 40 && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-6 w-6 p-0 shrink-0"
                                                        onClick={() => setSelectedEntry(entry)}
                                                    >
                                                        <IconEye className="h-3 w-3" />
                                                    </Button>
                                                )}
                                            </div>
                                        ) : '-'}
                                    </td>
                                )}
                                <td className="p-4 align-middle text-sm">
                                    {entry.shortcut_used ? (
                                        <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                                            {entry.shortcut_used}
                                        </span>
                                    ) : '-'}
                                </td>
                                <td className="p-4 align-middle text-sm">
                                    {entry.target_app ? (
                                        <span className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-xs">
                                            {entry.target_app}
                                        </span>
                                    ) : '-'}
                                </td>
                                <td className="p-4 align-middle text-right">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleDelete(entry.id)}
                                        className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                                    >
                                        <IconTrash className="h-4 w-4" />
                                    </Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Rows per page:</span>
                    <Select value={itemsPerPage.toString()} onValueChange={handlePageSizeChange}>
                        <SelectTrigger className="h-8 w-[70px]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {PAGE_SIZE_OPTIONS.map(size => (
                                <SelectItem key={size} value={size.toString()}>
                                    {size}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <span className="text-sm text-muted-foreground ml-4">
                        Showing {startIndex + 1}-{Math.min(endIndex, sortedEntries.length)} of {sortedEntries.length}
                    </span>
                </div>
                {totalPages > 1 && (
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={goToFirstPage}
                            disabled={currentPage === 1}
                            className="h-8 w-8 p-0"
                        >
                            <IconChevronsLeft className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={goToPreviousPage}
                            disabled={currentPage === 1}
                            className="h-8 w-8 p-0"
                        >
                            <IconChevronLeft className="h-4 w-4" />
                        </Button>
                        <span className="text-sm font-medium px-2">
                            Page {currentPage} of {totalPages}
                        </span>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={goToNextPage}
                            disabled={currentPage === totalPages}
                            className="h-8 w-8 p-0"
                        >
                            <IconChevronRight className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={goToLastPage}
                            disabled={currentPage === totalPages}
                            className="h-8 w-8 p-0"
                        >
                            <IconChevronsRight className="h-4 w-4" />
                        </Button>
                    </div>
                )}
            </div>

            {/* Text View Dialog */}
            <Dialog open={!!selectedEntry} onOpenChange={() => setSelectedEntry(null)}>
                <DialogContent className="max-w-2xl max-h-[80vh] z-[200]">
                    <DialogHeader>
                        <DialogTitle>Full Transcription</DialogTitle>
                        <DialogDescription>
                            {selectedEntry && formatDate(selectedEntry.timestamp)}
                            {selectedEntry?.shortcut_used && ` • Shortcut: ${selectedEntry.shortcut_used}`}
                            {selectedEntry?.target_app && ` • App: ${selectedEntry.target_app}`}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="mt-4 p-4 bg-muted rounded-lg overflow-y-auto max-h-[50vh]">
                        <p className="text-sm whitespace-pre-wrap break-words">
                            {selectedEntry?.text || 'No text available'}
                        </p>
                    </div>
                    <div className="flex justify-between items-center mt-4 text-sm text-muted-foreground">
                        <span>{selectedEntry?.word_count} words • {selectedEntry?.char_count} characters</span>
                        <span>{selectedEntry && formatDuration(selectedEntry.duration_ms)}</span>
                    </div>
                    <DialogClose asChild>
                        <Button variant="outline" className="mt-2">Close</Button>
                    </DialogClose>
                </DialogContent>
            </Dialog>
        </div>
    );
}
