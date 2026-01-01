-- CreateTable
CREATE TABLE "todo_page_settings" (
    "id" TEXT NOT NULL,
    "cover" TEXT,
    "icon" TEXT,
    "title" TEXT NOT NULL DEFAULT 'Weekly To-do List',
    "description" TEXT,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "todo_page_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "todo_page_settings_user_id_key" ON "todo_page_settings"("user_id");

-- AddForeignKey
ALTER TABLE "todo_page_settings" ADD CONSTRAINT "todo_page_settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
