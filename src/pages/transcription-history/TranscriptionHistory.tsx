import { DataTable } from "@/components/data-table"
import data from "../../data/dashboard-data.json"

export default function TranscriptionHistory() {
    return (
        <div className="flex flex-col gap-4 p-4 md:p-6">
            <div className="flex flex-col gap-1">
                <h1 className="text-2xl font-semibold">Transcription History</h1>
                <p className="text-muted-foreground">View and manage your past transcriptions</p>
            </div>
            <DataTable data={data} />
        </div>
    )
}
