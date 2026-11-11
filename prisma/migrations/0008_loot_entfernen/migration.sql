-- Loot-Index entfernt (2026-11-11).
--
-- Der Index stand auf der Journal-API. Im ersten Durchlauf mit echten Daten
-- lieferte sie für WoW Forever keine einzige Instanz – der Index blieb leer
-- und die Upgrade-Funktion konnte nichts zeigen. Der Nutzer hat entschieden,
-- den Bereich zu entfernen. Die Tabellen waren damit ohnehin leer.
-- Kommt die Journal-API für Forever, steht der alte Code in der Git-Historie.

DROP TABLE "LootItem";
DROP TABLE "LootIndexRun";
