import { execSync } from "child_process";
import { readFileSync, stat, writeFileSync } from "fs";
import glob from "glob";

export async function autoMigrate() {
    const newVersion = JSON.parse(readFileSync("package.json", "utf8")).version;
    if (
        !(await new Promise((resolve) =>
            stat("version.txt", (err, stats) => resolve(err ? null : stats)),
        ))
    ) {
        console.warn("version.txt not found, not migrating!");
        console.info("Writing package.json version to version.txt");
        writeFileSync("version.txt", newVersion);
        return;
    }
    try {
        const oldVersion = readFileSync("version.txt", "utf8").trim();
        if (!oldVersion) {
            console.warn("old version not found, not migrating!");
            console.info("Writing package.json version to version.txt");
            writeFileSync("version.txt", newVersion);
            return;
        }
        const oldVersionNum = Number(oldVersion.replace(/\D/g, ""));
        const newVersionNum = Number(newVersion.replace(/\D/g, ""));
        if (oldVersion !== newVersion) {
            console.info(`Auto-migrating from version ${oldVersion} to ${newVersion}...`);
            // js mode
            const jsMigrate = await glob("dist/migrate/*/*.js");
            if (jsMigrate.length) {
                console.log(jsMigrate);
                const jsMigrateResults = jsMigrate.map((file) => {
                    const migrateVersionNum = Number(
                        file
                            .split("/")
                            .pop()
                            .replace(/[^\d\-]/g, "")
                            .replace("-", "."),
                    );
                    if (
                        migrateVersionNum > oldVersionNum &&
                        migrateVersionNum <= newVersionNum
                    ) {
                        const cmd = `node ${file}`;
                        console.info(`executing ${cmd}`);
                        execSync(cmd);
                        return true;
                    }
                    return false;
                });
                if (jsMigrateResults.includes(true)) {
                    console.info("Migration complete.");
                } else {
                    console.info("No migration files found.");
                }
            } else {
                // ts mode
                const tsMigrate = await glob("src/migrate/*/*.ts");
                if (tsMigrate.length) {
                    const tsMigrateResults = tsMigrate.map((file) => {
                        const migrateVersionNum = Number(
                            file
                                .split("/")
                                .pop()
                                .replace(/[^\d\-]/g, "")
                                .replace("-", "."),
                        );
                        if (
                            migrateVersionNum > oldVersionNum &&
                            migrateVersionNum <= newVersionNum
                        ) {
                            const cmd = `yarn ts-node ${file}`;
                            console.info(`executing ${cmd}`);
                            execSync(cmd);
                            return true;
                        }
                        return false;
                    });
                    if (tsMigrateResults.includes(true)) {
                        console.info("Migration complete.");
                    } else {
                        console.info("No migration files found.");
                    }
                }
            }
            console.info("Writing new version to version.txt");
            writeFileSync("version.txt", newVersion);
        } else {
            console.info("Version not changed. No migration needed.");
        }
    } catch (error) {
        console.info("Migration failed with the following error:");
        console.error(error);
    }
}
