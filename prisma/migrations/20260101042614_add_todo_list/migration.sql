-- CreateTable
CREATE TABLE "todo_weeks" (
    "id" TEXT NOT NULL,
    "week_start" TIMESTAMP(3) NOT NULL,
    "week_end" TIMESTAMP(3) NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "todo_weeks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "todos" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "is_completed" BOOLEAN NOT NULL DEFAULT false,
    "day" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "week_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "todos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "todo_weeks_user_id_idx" ON "todo_weeks"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "todo_weeks_user_id_week_start_key" ON "todo_weeks"("user_id", "week_start");

-- CreateIndex
CREATE INDEX "todos_week_id_idx" ON "todos"("week_id");

-- CreateIndex
CREATE INDEX "todos_week_id_day_order_idx" ON "todos"("week_id", "day", "order");

-- AddForeignKey
ALTER TABLE "todo_weeks" ADD CONSTRAINT "todo_weeks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "todos" ADD CONSTRAINT "todos_week_id_fkey" FOREIGN KEY ("week_id") REFERENCES "todo_weeks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
