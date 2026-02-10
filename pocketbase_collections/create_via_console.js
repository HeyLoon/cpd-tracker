// 在 PocketBase Admin UI 的開發者控制台中執行此代碼
// Settings -> Developers -> Console

// 創建 Assets Collection
const assetsCollection = new Collection({
  name: "assets",
  type: "base",
  schema: [
    {name: "name", type: "text", required: true},
    {name: "category", type: "select", required: true, options: {maxSelect: 1, values: ["Tech", "Music", "Life", "Others"]}},
    {name: "price", type: "number", required: true},
    {name: "currency", type: "select", required: true, options: {maxSelect: 1, values: ["TWD", "USD", "JPY"]}},
    {name: "purchase_date", type: "date", required: true},
    {name: "target_lifespan", type: "number", required: false},
    {name: "status", type: "select", required: true, options: {maxSelect: 1, values: ["Active", "Sold", "Retired"]}},
    {name: "role", type: "select", required: true, options: {maxSelect: 1, values: ["Standalone", "System", "Component", "Accessory"]}},
    {name: "system_id", type: "text", required: false},
    {name: "linked_asset_id", type: "text", required: false},
    {name: "photo", type: "file", required: false, options: {maxSelect: 1, maxSize: 5242880}},
    {name: "notes", type: "text", required: false},
    {name: "sold_price", type: "number", required: false},
    {name: "power_watts", type: "number", required: false, options: {min: 0}},
    {name: "daily_usage_hours", type: "number", required: false, options: {min: 0, max: 24}},
    {name: "recurring_maintenance_cost", type: "number", required: false, options: {min: 0}},
    {name: "maintenance_log", type: "json", required: false},
    {name: "user", type: "relation", required: true, options: {collectionId: "_pb_users_auth_", maxSelect: 1, cascadeDelete: true}},
    {name: "synced", type: "bool", required: false},
    {name: "local_id", type: "text", required: false}
  ],
  listRule: "user = @request.auth.id",
  viewRule: "user = @request.auth.id",
  createRule: "@request.auth.id != \"\" && user = @request.auth.id",
  updateRule: "user = @request.auth.id",
  deleteRule: "user = @request.auth.id"
});

$app.dao().saveCollection(assetsCollection);

// 創建 Subscriptions Collection
const subsCollection = new Collection({
  name: "subscriptions",
  type: "base",
  schema: [
    {name: "name", type: "text", required: true},
    {name: "cost", type: "number", required: true, options: {min: 0}},
    {name: "currency", type: "select", required: true, options: {maxSelect: 1, values: ["TWD", "USD", "JPY"]}},
    {name: "billing_cycle", type: "select", required: true, options: {maxSelect: 1, values: ["Monthly", "Quarterly", "Yearly"]}},
    {name: "start_date", type: "date", required: true},
    {name: "category", type: "select", required: true, options: {maxSelect: 1, values: ["Software", "Service", "Entertainment"]}},
    {name: "status", type: "select", required: true, options: {maxSelect: 1, values: ["Active", "Cancelled"]}},
    {name: "cancelled_date", type: "date", required: false},
    {name: "notes", type: "text", required: false},
    {name: "user", type: "relation", required: true, options: {collectionId: "_pb_users_auth_", maxSelect: 1, cascadeDelete: true}},
    {name: "synced", type: "bool", required: false},
    {name: "local_id", type: "text", required: false}
  ],
  listRule: "user = @request.auth.id",
  viewRule: "user = @request.auth.id",
  createRule: "@request.auth.id != \"\" && user = @request.auth.id",
  updateRule: "user = @request.auth.id",
  deleteRule: "user = @request.auth.id"
});

$app.dao().saveCollection(subsCollection);
