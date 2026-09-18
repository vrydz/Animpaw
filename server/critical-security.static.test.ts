import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const root = path.resolve(import.meta.dirname, "..");
const read = (file: string) => fs.readFileSync(path.join(root, file), "utf8");

test("direct Firestore access is denied", () => {
  const rules = read("firestore.rules");
  assert.match(rules, /allow read, write: if false/);
  assert.doesNotMatch(rules, /allow read, write: if true/);
});

test("payment gateway feature is unavailable to clients", () => {
  const server = read("server.ts");
  const shop = read("src/components/ShopView.tsx");
  const packageJson = read("package.json");
  assert.match(server, /Pembayaran sementara tidak tersedia/);
  assert.match(server, /"\/api\/shop\/buy-points"/);
  assert.match(server, /"\/api\/shop\/buy-booster"/);
  assert.doesNotMatch(shop, /midtrans|ipaymu|paymentUrl|buy-points|buy-booster/i);
  assert.doesNotMatch(packageJson, /ipaymu-nodejs-api/i);
  assert.doesNotMatch(server, /function generateIpaymuSignature|function generateBoosterCard|function createBoosterRolls/);
  assert.doesNotMatch(server, /paymentGateway\s*:/);
});

test("territory battle rejects duplicate decks and only rewards a breach", () => {
  const server = read("server.ts");
  const route = server.slice(server.indexOf('app.post("/api/territory/battle"'), server.indexOf('// 5. Claim Accumulated Cores'));
  assert.match(route, /attackerCardIds\.length > 3/);
  assert.match(route, /uniqueAttackerCardIds\.length !== attackerCardIds\.length/);
  assert.match(route, /membutuhkan minimal 1 energi/);
  assert.match(route, /let pointsRewarded = 0/);
  assert.match(route, /let coresRewarded = 0/);
  const rewardBlock = route.slice(route.indexOf("if (targetNode.defenseHp <= 0)"));
  assert.match(rewardBlock, /pointsRewarded = 60/);
  assert.match(rewardBlock, /coresRewarded = 2/);
});

test("raid turns require a participant and an idempotent expected turn", () => {
  const server = read("server.ts");
  const route = server.slice(server.indexOf('app.post("/api/raid/lobby/turn"'), server.indexOf('// 10. Developer'));
  assert.match(route, /slot\.userId === user\.id/);
  assert.match(route, /action !== "attack"/);
  assert.match(route, /expectedTurn !== room\.currentTurn/);
  const arena = read("src/components/RaidBattleArena.tsx");
  assert.match(arena, /expectedTurn: room\.currentTurn/);
  assert.match(arena, /room\.status === "waiting" \|\| room\.status === "in_battle"/);
  assert.match(arena, /res\.status === 409 && data\.room/);
});

test("forge validates combat identities and raid preserves an energy sink", () => {
  const server = read("server.ts");
  const forgeRoute = server.slice(server.indexOf('app.post("/api/forge"'), server.indexOf("// Get User Cards"));
  assert.match(forgeRoute, /validElements/);
  assert.match(forgeRoute, /validStyles/);
  assert.match(forgeRoute, /Elemen atau style kartu tidak valid/);

  const raidData = read("src/data/raidBossData.ts");
  const rewards = [...raidData.matchAll(/energyRefill:\s*(\d+)/g)].map(match => Number(match[1]));
  assert.ok(rewards.length > 0);
  assert.ok(rewards.every(reward => reward === 1));
  assert.match(server, /b\.rewards\.energyRefill !== 1/);
  assert.match(server, /b\.rewards\.energyRefill = 1/);
});

test("medium balance rules are enforced by the server", () => {
  const server = read("server.ts");
  const websocket = read("server/websocket.ts");
  assert.match(server, /projectedNodesCount > maxAllowedNodes/);
  assert.match(server, /totalRaidDamage \* 0\.05/);
  assert.match(server, /chosenSkill\.effectType === "critical"/);
  assert.match(server, /chosenSkill\.effectType === "rage"/);
  assert.match(server, /chosenSkill\.effectType === "leech"/);
  assert.match(websocket, /else if \(Math\.random\(\) < 0\.5\)/);
});

test("all combat modes share elemental and speed balance helpers", () => {
  const server = read("server.ts");
  const websocket = read("server/websocket.ts");
  assert.match(server, /ELEMENT_ADVANTAGE_MULTIPLIER/);
  assert.match(server, /ELEMENT_RESISTANCE_MULTIPLIER/);
  assert.match(server, /getSpeedMultiplier\(attackerCard\.spd, defenderCard\.spd\)/);
  assert.match(server, /getSpeedMultiplier\(card\.spd, boss\.spd\)/);
  assert.match(websocket, /getSpeedMultiplier\(cardA\.spd, cardB\.spd\)/);
  assert.doesNotMatch(websocket, /\+40% PWR/);
});

test("catalog and progression rules have single shared sources", () => {
  const server = read("server.ts");
  const websocket = read("server/websocket.ts");
  assert.match(server, /NEKOMON_SPECIES_CATALOG\.filter/);
  assert.match(server, /Spesies Katalog Resmi/);
  assert.doesNotMatch(server, /function createBoosterRolls|function generateBoosterCard/);
  assert.match(server, /applyCardXp\(card, xpGained\)/);
  assert.match(server, /applyCardXp\(c, rewards\.cardXp\)/);
  assert.match(websocket, /applyCardXp\(card, xpGained\)/);
});

test("server authentication does not trust identity headers or unsigned tokens", () => {
  const server = read("server.ts");
  const authSlice = server.slice(server.indexOf("function getAuthUser"), server.indexOf("// User Heartbeat endpoint"));
  assert.match(authSlice, /verifySessionToken/);
  assert.doesNotMatch(authSlice, /x-user-id|x-user-email|Buffer\.from\(token, "base64"/i);
});

test("Google authentication verifies an ID token and browser restore is disabled", () => {
  const server = read("server.ts");
  assert.match(server, /verifyIdToken\(idToken\)/);
  assert.match(server, /Sinkronisasi backup browser telah dinonaktifkan/);
});

test("password reset tokens expire and are never returned", () => {
  const server = read("server.ts");
  assert.match(server, /crypto\.randomBytes\(32\)/);
  assert.match(server, /expiresAt: new Date\(Date\.now\(\) \+ 15 \* 60 \* 1000\)/);
  const resetResponse = server.slice(server.indexOf('app.post("/api/auth/forgot-password"'), server.indexOf('// Auth: Reset Password Page HTML Form'));
  assert.doesNotMatch(resetResponse, /res\.json\(\{\s*success:\s*true,\s*message:[^}]*\btoken\s*[,}]/);
});

test("authentication flows enforce verification, expiry, and abuse controls", () => {
  const server = read("server.ts");
  const authForm = read("src/components/AuthForm.tsx");
  const mailer = read("server/mailer.ts");
  const firestore = read("server/firestoreDb.ts");

  const legacyRegister = server.slice(server.indexOf('// Auth: Register (Legacy direct route)'), server.indexOf('// Auth: Send Email Verification'));
  assert.match(legacyRegister, /status\(410\)/);
  assert.doesNotMatch(legacyRegister, /db\.users\.push/);

  assert.match(server, /crypto\.randomBytes\(32\).*base64url/);
  assert.match(server, /crypto\.randomInt\(100000, 1000000\)/);
  assert.match(server, /isExpired\(verification\)/);
  assert.match(server, /failedAttempts/);
  assert.match(server, /authWriteRateLimit/);
  assert.match(server, /loginRateLimit/);

  assert.doesNotMatch(authForm, /password:\s*passwordStr|backup\.password|\/api\/auth\/sync/);
  assert.doesNotMatch(authForm, /setMode\("reset_password"\)|JSON\.stringify\(\{ token, newPassword \}\)/);
  assert.match(authForm, /localStorage\.removeItem\("nekomon_backup_users"\)/);

  assert.match(mailer, /connectionTimeout/);
  assert.match(mailer, /socketTimeout/);
  assert.match(firestore, /collection\("authCredentials"\)/);
  assert.match(firestore, /passwordHash/);
});

test("demo account is provisioned with a hashed known password", () => {
  const server = read("server.ts");
  const database = JSON.parse(read("server/db.json"));
  const demo = database.users.find((user: any) => user.username === "demo1");

  assert.ok(demo);
  assert.equal(demo.email, "demo1@nekomon.online");
  assert.match(demo.password, /^scrypt\$/);
  assert.match(server, /password: hashPassword\("n3komontcg"\)/);
  assert.match(server, /verifyPassword\("n3komontcg", demoUser\.password\)/);
});

test("production secrets are not committed as fallback credentials", () => {
  const server = read("server.ts");
  const envExample = read(".env.example");
  assert.doesNotMatch(server, /Mid-server-|945D2CBE|4rmyofDEATH/);
  assert.doesNotMatch(envExample, /Mid-server-|945D2CBE/);
});
