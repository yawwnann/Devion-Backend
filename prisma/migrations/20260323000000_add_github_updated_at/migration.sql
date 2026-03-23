-- AlterTable
ALTER TABLE "github_repos" ADD COLUMN     "github_updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
