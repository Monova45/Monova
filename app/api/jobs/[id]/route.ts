import { NextResponse } from "next/server";
import { getMagnificTask } from "@/lib/ai/magnific-provider";
import { getDatabase } from "@/lib/database";
import { AppError } from "@/lib/errors";

export const runtime = "nodejs";

interface StoredJobOutput {
  externalJobId?: string;
  generated?: string[];
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await getDatabase().query<{
    id: string;
    provider: string | null;
    status: string;
    progress: number;
    output: StoredJobOutput;
    error_message: string | null;
  }>(
    "select id, provider, status, progress, output, error_message from public.jobs where id = $1 limit 1",
    [id],
  );

  const job = result.rows[0];
  if (!job) return NextResponse.json({ error: "Job no encontrado." }, { status: 404 });

  try {
    if (job.provider === "magnific" && job.output.externalJobId && !["completed", "failed", "cancelled"].includes(job.status)) {
      const task = await getMagnificTask(job.output.externalJobId);
      const progress = task.status === "completed" ? 100 : task.status === "processing" ? 55 : 10;
      const output = { ...job.output, generated: task.generated };
      await getDatabase().query(
        "update public.jobs set status=$2, progress=$3, output=$4::jsonb, updated_at=now() where id=$1",
        [job.id, task.status, progress, JSON.stringify(output)],
      );
      return NextResponse.json({ id: job.id, status: task.status, progress, generated: task.generated });
    }

    return NextResponse.json({ id: job.id, status: job.status, progress: job.progress, generated: job.output.generated ?? [], error: job.error_message });
  } catch (error) {
    if (error instanceof AppError) return NextResponse.json({ error: error.message, code: error.code }, { status: error.statusCode });
    return NextResponse.json({ error: "No se pudo consultar el trabajo." }, { status: 500 });
  }
}
