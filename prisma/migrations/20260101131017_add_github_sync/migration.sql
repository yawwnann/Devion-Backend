-- AlterTable
ALTER TABLE "projects" ADD COLUMN     "github_repo" TEXT,
ADD COLUMN     "github_url" TEXT,
ADD COLUMN     "last_synced_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "todos" ADD COLUMN     "github_issue_number" INTEGER,
ADD COLUMN     "github_issue_url" TEXT,
ADD COLUMN     "github_labels" TEXT,
ADD COLUMN     "github_repo_name" TEXT,
ADD COLUMN     "last_synced_at" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "todos_github_issue_number_github_repo_name_idx" ON "todos"("github_issue_number", "github_repo_name");
