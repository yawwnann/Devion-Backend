-- CreateEnum
CREATE TYPE "PageStatus" AS ENUM ('DRAFT', 'PRIVATE', 'PUBLISHED');

-- AlterTable
ALTER TABLE "github_repos" ALTER COLUMN "github_updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "pages" ADD COLUMN     "published_at" TIMESTAMP(3),
ADD COLUMN     "status" "PageStatus" NOT NULL DEFAULT 'DRAFT';

-- AlterTable
ALTER TABLE "todos" ADD COLUMN     "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'TODO';

-- CreateTable
CREATE TABLE "github_commits" (
    "id" TEXT NOT NULL,
    "sha" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "author_email" TEXT,
    "author_avatar" TEXT,
    "url" TEXT NOT NULL,
    "html_url" TEXT NOT NULL,
    "additions" INTEGER NOT NULL DEFAULT 0,
    "deletions" INTEGER NOT NULL DEFAULT 0,
    "committed_at" TIMESTAMP(3) NOT NULL,
    "todo_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "github_commits_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "github_commits_sha_key" ON "github_commits"("sha");

-- CreateIndex
CREATE INDEX "github_commits_todo_id_idx" ON "github_commits"("todo_id");

-- CreateIndex
CREATE INDEX "github_commits_todo_id_committed_at_idx" ON "github_commits"("todo_id", "committed_at");

-- CreateIndex
CREATE INDEX "pages_status_idx" ON "pages"("status");

-- AddForeignKey
ALTER TABLE "github_commits" ADD CONSTRAINT "github_commits_todo_id_fkey" FOREIGN KEY ("todo_id") REFERENCES "todos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
