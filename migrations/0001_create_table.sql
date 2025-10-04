-- CreateTable
CREATE TABLE "tbl_access_role" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "deleted_at" DATETIME
);

-- CreateTable
CREATE TABLE "tbl_historial" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "rol_id" INTEGER NOT NULL,
    "action" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "response" TEXT NOT NULL,
    "chat_num" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "tbl_historial_rol_id_fkey" FOREIGN KEY ("rol_id") REFERENCES "tbl_account" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "tbl_account" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "rol_id" INTEGER NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "tbl_account_rol_id_fkey" FOREIGN KEY ("rol_id") REFERENCES "tbl_access_role" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
