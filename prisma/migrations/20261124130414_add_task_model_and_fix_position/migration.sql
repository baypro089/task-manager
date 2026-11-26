-- AlterTable
ALTER TABLE "tasks" ALTER COLUMN "position" SET DEFAULT 0,
ALTER COLUMN "position" SET DATA TYPE DOUBLE PRECISION;

-- CreateIndex
CREATE INDEX "tasks_project_id_status_id_position_idx" ON "tasks"("project_id", "status_id", "position");

-- CreateIndex
CREATE INDEX "tasks_parent_id_idx" ON "tasks"("parent_id");

-- CreateIndex
CREATE INDEX "tasks_due_date_idx" ON "tasks"("due_date");

-- CreateIndex
CREATE INDEX "tasks_created_by_idx" ON "tasks"("created_by");
