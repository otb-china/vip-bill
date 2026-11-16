<template>
  <div class="home-page" :style="themeStyle">
    <header v-if="!activeBill" class="page-header">
      <div>
        <div class="header-title">
          <h1>会员账单</h1>
          <span class="header-bill-count">{{ bills.length }} 个账单</span>
        </div>
      </div>
      <div class="header-actions">
        <button v-if="showScrollTop" class="header-icon" type="button" aria-label="回到顶部" @click="scrollToTop">
          <el-icon><Top /></el-icon>
        </button>
        <button class="header-icon" type="button" aria-label="设置" @click="settingsPopup = true">
          <el-icon><Setting /></el-icon>
        </button>
      </div>
      <div class="bill-toolbar">
        <label class="bill-search">
          <el-icon aria-hidden="true"><Search /></el-icon>
          <input v-model="billSearch" type="search" aria-label="搜索账单" placeholder="搜索账单" @keydown.esc="billSearch = ''" />
        </label>
        <button class="add-bill-button" type="button" @click="addBill">
          <el-icon aria-hidden="true"><Plus /></el-icon>
          <span>新增账单</span>
        </button>
      </div>
    </header>

    <main v-if="!activeBill" class="bill-list-view">
      <section v-if="visibleBills.length" class="bill-grid">
        <button
          v-for="bill in visibleBills"
          :key="bill.id"
          class="bill-card"
          :class="{ 'is-empty': isBillRemainingEmpty(bill) }"
          type="button"
          @click="openBill(bill.id)"
        >
          <span class="bill-card-heading">
            <span class="bill-card-name">{{ bill.name }}</span>
            <span class="bill-card-balance-mark" role="img" aria-label="剩余金额">余</span>
          </span>
          <strong class="bill-card-amount">¥{{ formatMoney(billRemaining(bill)) }}</strong>
          <span class="usage-bar" aria-hidden="true"><span :style="{ width: billUsedPercent(bill) + '%' }"></span></span>
          <span class="bill-card-footer">
            <time class="bill-card-date" :datetime="bill.updatedAt" :title="formatBillUpdatedAt(bill.updatedAt)">
              {{ formatBillUpdatedAt(bill.updatedAt, true) }}
            </time>
            <span>已用 {{ billUsedPercent(bill) }}%</span>
          </span>
        </button>
      </section>

      <div v-else-if="!bills.length" class="empty-state">
        <strong>还没有账单</strong>
        <span>点击顶部「新增账单」创建第一张会员账单。</span>
      </div>
      <div v-else class="empty-state">
        <strong>没有匹配的账单</strong>
        <span>试试其他账单名。</span>
      </div>
    </main>

    <main v-else class="bill-detail-view" aria-label="账单明细">
      <nav class="detail-topbar">
        <button class="round-icon-button" type="button" aria-label="返回账单列表" title="返回账单列表" @click="closeBill">
          <el-icon aria-hidden="true"><Back /></el-icon>
        </button>
        <span class="detail-topbar-title">账单详情</span>
        <button class="round-icon-button is-danger" type="button" aria-label="删除账单" title="删除账单" @click="removeActiveBill">
          <el-icon aria-hidden="true"><Delete /></el-icon>
        </button>
      </nav>

      <section class="hero-card" aria-label="账单概览">
        <input v-model.trim="activeBill.name" class="hero-name-input" aria-label="账单名" placeholder="点击输入账单名" @input="touchActiveBill" />

        <div class="balance-main">
          <span>剩余金额</span>
          <strong>¥{{ formatMoney(activeBillRemaining) }}</strong>
        </div>

        <div class="hero-usage">
          <span class="usage-bar is-light" aria-hidden="true"><span :style="{ width: billUsedPercent(activeBill) + '%' }"></span></span>
          <span>已用 {{ billUsedPercent(activeBill) }}%</span>
        </div>

        <div class="balance-breakdown">
          <label class="balance-stat is-editable">
            <span>总充值</span>
            <span class="balance-value">
              <span aria-hidden="true">¥</span>
              <input
                v-model.number="activeBill.totalAmount"
                class="budget-input"
                aria-label="总充值"
                type="number"
                inputmode="decimal"
                min="0"
                step="0.01"
                placeholder="0.00"
                @input="touchActiveBill"
              />
            </span>
          </label>
          <div class="balance-stat">
            <span>累计消费</span>
            <strong class="balance-value">¥{{ formatMoney(activeBillTotal) }}</strong>
          </div>
        </div>
      </section>

      <section class="items-panel" aria-labelledby="items-heading">
        <div class="section-row">
          <div class="items-heading">
            <h2 id="items-heading">消费明细</h2>
            <span>{{ validActiveBillItems.length }} 项</span>
          </div>
          <button class="add-item-row" type="button" @click="addItem">
            <el-icon aria-hidden="true"><Plus /></el-icon>
            <span>新增子项</span>
          </button>
        </div>
        <p class="items-tip">虚线框内容可点击修改，左滑删除子项</p>

        <p v-if="!activeBill.items.length" class="items-empty">暂无消费记录</p>
        <div v-else class="item-list">
          <van-swipe-cell v-for="(item, index) in activeBill.items" :key="item.id" class="item-swipe">
            <div class="item-row">
              <span class="item-index" aria-hidden="true">{{ activeBill.items.length - index }}</span>
              <div class="item-content">
                <input
                  v-if="editingNoteId === item.id"
                  v-focus-note
                  v-model.trim="item.name"
                  class="item-note-input"
                  aria-label="备注（选填）"
                  placeholder="备注（选填）"
                  @input="touchActiveBill"
                  @blur="editingNoteId = null"
                  @keydown.enter="finishItemNote"
                />
                <button
                  v-else
                  class="item-note"
                  :class="{ 'is-placeholder': !item.name.trim() }"
                  type="button"
                  :aria-label="item.name.trim() ? '编辑备注' : '添加备注'"
                  @click="editingNoteId = item.id"
                >
                  {{ item.name.trim() || "添加备注" }}
                </button>
              </div>
              <label class="item-amount">
                <span aria-hidden="true">¥</span>
                <input
                  v-model.number="item.price"
                  class="price-input"
                  aria-label="金额"
                  type="number"
                  inputmode="decimal"
                  min="0"
                  step="0.01"
                  placeholder="金额"
                  @input="touchActiveBill"
                />
              </label>
            </div>
            <template #right>
              <button class="swipe-delete-action" type="button" aria-label="删除子项" @click="removeItem(item.id)">
                <el-icon><Delete /></el-icon>
                <span>删除</span>
              </button>
            </template>
          </van-swipe-cell>
        </div>
      </section>
    </main>

    <SettingsPopup
      v-model:show="settingsPopup"
      :theme-options="themeOptions"
      :current-theme="currentTheme"
      :current-theme-name="currentThemeOption.name"
      :recycle-count="deletedBills.length"
      @set-theme="setTheme"
      @export="exportAllData"
      @open-import="openImportExport"
      @open-recycle="openRecycleBin"
      @reset="resetAllData"
    />

    <van-popup v-model:show="recyclePopup" position="bottom" round destroy-on-close>
      <div class="popup-body recycle-popup">
        <div class="popup-head">
          <div>
            <h3>回收站</h3>
            <p>删除的账单保留 7 天，可在这里恢复。</p>
          </div>
        </div>

        <div v-if="deletedBills.length" class="recycle-list">
          <div v-for="bill in deletedBills" :key="bill.id" class="recycle-item">
            <div>
              <strong>{{ bill.name }}</strong>
              <span>¥{{ formatMoney(billTotal(bill)) }} · {{ getRecycleDaysLeft(bill) }} 天后清除</span>
            </div>
            <div class="recycle-actions">
              <button type="button" @click="restoreDeletedBill(bill.id)">恢复</button>
              <button class="danger" type="button" @click="purgeDeletedBill(bill.id)">删除</button>
            </div>
          </div>
        </div>

        <div v-else class="empty-state compact">
          <strong>回收站为空</strong>
          <span>删除的账单会在这里保留一周。</span>
        </div>
      </div>
    </van-popup>

    <ImportDataPopup
      v-model:show="importExportInfo.show"
      :bill-count="bills.length"
      :file-name="importInfo.fileName"
      :has-file="Boolean(importInfo.dataStr)"
      @file-loaded="onImportFileLoaded"
      @file-error="showToast"
      @import="importData"
    />
  </div>
</template>

<script lang="ts" setup>
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from "vue";
import { showConfirmDialog, showToast } from "vant";
import { Back, Delete, Plus, Search, Setting, Top } from "@element-plus/icons-vue";
import ImportDataPopup from "@/components/ImportDataPopup.vue";
import SettingsPopup from "@/components/SettingsPopup.vue";
import { DEFAULT_THEME, isThemeKey, themeOptions } from "@/config/themes";
import { useBackupActions } from "@/composables/useBackupActions";
import { LStorage } from "@/utils/localStorage.ts";
import {
  createEmptyBill,
  createEmptyBillItem,
  createId,
  formatMoney,
  getBillUpdatedTime,
  normalizeDeletedBills,
  normalizeBills,
  sumBillItems,
} from "@/utils/billData.ts";
import type { ThemeKey } from "@/config/themes";
import type { Bill, DeletedBill } from "@/types/bill";

const DATE_FORMAT = "YYYY-MM-DD";
const SCROLL_TOP_THRESHOLD = 240;
const RECYCLE_KEEP_DAYS = 7;
const RECYCLE_KEEP_MS = RECYCLE_KEEP_DAYS * 24 * 60 * 60 * 1000;

const showScrollTop = ref(false);
const currentTheme = ref<ThemeKey>(DEFAULT_THEME);
const settingsPopup = ref(false);
const recyclePopup = ref(false);
const bills = ref<Bill[]>([]);
const billSearch = ref("");
const deletedBills = ref<DeletedBill[]>([]);
const activeBillId = ref("");
const editingNoteId = ref<string | null>(null);
const vFocusNote = {
  mounted(input: HTMLInputElement) {
    input.focus();
  },
};
let billListScrollY = 0;

const billStorage = LStorage.new("vipBillData");
const recycleStorage = LStorage.new("vipBillRecycleBin");
const themeStorage = LStorage.new("vipBillTheme");

const currentThemeOption = computed(() => {
  return themeOptions.find((theme) => theme.key === currentTheme.value) || themeOptions[0];
});
const themeStyle = computed(() => currentThemeOption.value.variables);
const activeBill = computed(() => bills.value.find((bill) => bill.id === activeBillId.value));
const sortedBills = computed(() => {
  return [...bills.value].sort((firstBill, secondBill) => {
    const emptySort = Number(isBillRemainingEmpty(firstBill)) - Number(isBillRemainingEmpty(secondBill));
    if (emptySort) return emptySort;
    return getBillUpdatedTime(secondBill) - getBillUpdatedTime(firstBill);
  });
});
const visibleBills = computed(() => {
  const keyword = billSearch.value.trim().toLowerCase();
  if (!keyword) return sortedBills.value;
  return sortedBills.value.filter((bill) => bill.name.toLowerCase().includes(keyword));
});
const activeBillTotal = computed(() => activeBill.value ? billTotal(activeBill.value) : 0);
const activeBillRemaining = computed(() => activeBill.value ? Number(activeBill.value.totalAmount || 0) - activeBillTotal.value : 0);
const validActiveBillItems = computed(() => activeBill.value ? getValidItems(activeBill.value.items) : []);

const {
  importExportInfo,
  importInfo,
  openImportExport,
  exportAllData,
  onImportFileLoaded,
  resetAllData,
  importData,
} = useBackupActions({
  bills,
  deletedBills,
  settingsPopup,
  dateFormat: DATE_FORMAT,
  initData: () => init(),
});

watch(bills, saveBills, { deep: true });
watch(deletedBills, saveDeletedBills, { deep: true });

watch(() => activeBill.value?.id, async (billId, previousBillId) => {
  editingNoteId.value = null;
  if (!previousBillId && billId) {
    billListScrollY = window.scrollY;
  }

  await nextTick();
  if (activeBill.value?.id !== billId) return;

  window.scrollTo({ top: billId ? 0 : billListScrollY, behavior: "instant" });
  updateScrollTopVisibility();
});

function billTotal(bill: Bill) {
  return sumBillItems(getValidItems(bill.items));
}

function billRemaining(bill: Bill) {
  return Number(bill.totalAmount || 0) - billTotal(bill);
}

function billUsedPercent(bill: Bill) {
  const total = Number(bill.totalAmount || 0);
  const spent = billTotal(bill);
  if (total <= 0) return spent > 0 ? 100 : 0;
  return Math.min(100, Math.max(0, Math.round((spent / total) * 100)));
}

function isBillRemainingEmpty(bill: Bill) {
  return billRemaining(bill) <= 0;
}

function formatBillUpdatedAt(value: string, dateOnly = false) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "--";
  const pad = (num: number) => String(num).padStart(2, "0");
  const day = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  return dateOnly ? day : `${day} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function saveBills() {
  if (bills.value.length) {
    billStorage.setter(bills.value);
  } else {
    billStorage.remove();
  }
}

function saveDeletedBills() {
  if (deletedBills.value.length) {
    recycleStorage.setter(deletedBills.value);
  } else {
    recycleStorage.remove();
  }
}

function setTheme(theme: ThemeKey) {
  currentTheme.value = theme;
  themeStorage.setter(theme);
}

function init() {
  const storedTheme = themeStorage.getter();
  currentTheme.value = isThemeKey(storedTheme) ? storedTheme : DEFAULT_THEME;
  bills.value = normalizeBills(billStorage.getter());
  deletedBills.value = purgeExpiredDeletedBills(normalizeDeletedBills(recycleStorage.getter()));
  if (activeBillId.value && !bills.value.some((bill) => bill.id === activeBillId.value)) {
    activeBillId.value = "";
  }
}

function addBill() {
  const bill = createEmptyBill(`账单 ${bills.value.length + 1}`);
  bill.items.push(createEmptyBillItem());
  bills.value.unshift(bill);
  billSearch.value = "";
  activeBillId.value = bill.id;
}

function openBill(id: string) {
  activeBillId.value = id;
}

function closeBill() {
  pruneActiveBillInvalidItems();
  removeInvalidEmptyBill();
  activeBillId.value = "";
}

function touchActiveBill() {
  if (!activeBill.value) return;
  activeBill.value.updatedAt = new Date().toISOString();
}

function finishItemNote(event: KeyboardEvent) {
  if (event.isComposing) return;
  if (event.currentTarget instanceof HTMLInputElement) {
    event.currentTarget.blur();
  }
}

function addItem() {
  if (!activeBill.value) return;
  if (!canAppendItem()) {
    showToast("请先填写当前子项的金额");
    return;
  }
  activeBill.value.items.unshift(createEmptyBillItem());
  touchActiveBill();
}

function canAppendItem() {
  if (!activeBill.value) return false;
  return activeBill.value.items.every(isValidItem);
}

function isValidItem(item: Bill["items"][number]) {
  return item.price !== "" && Number.isFinite(Number(item.price));
}

function getValidItems(items: Bill["items"]) {
  return items.filter(isValidItem);
}

function pruneActiveBillInvalidItems() {
  if (!activeBill.value) return;
  const validItems = getValidItems(activeBill.value.items);
  if (validItems.length === activeBill.value.items.length) return;
  activeBill.value.items = validItems;
  touchActiveBill();
}

function removeInvalidEmptyBill() {
  if (!activeBill.value || activeBill.value.items.length || hasValidBillProfile(activeBill.value)) return;
  bills.value = bills.value.filter((bill) => bill.id !== activeBillId.value);
}

function hasValidBillProfile(bill: Bill) {
  return Boolean(bill.name.trim()) && bill.totalAmount !== "" && Number.isFinite(Number(bill.totalAmount));
}

function purgeExpiredDeletedBills(list: DeletedBill[]) {
  const now = Date.now();
  return list.filter((bill) => now - new Date(bill.deletedAt).getTime() < RECYCLE_KEEP_MS);
}

function getRecycleDaysLeft(bill: DeletedBill) {
  const deletedTime = new Date(bill.deletedAt).getTime();
  const leftMs = Math.max(0, RECYCLE_KEEP_MS - (Date.now() - deletedTime));
  return Math.max(1, Math.ceil(leftMs / (24 * 60 * 60 * 1000)));
}

function openRecycleBin() {
  deletedBills.value = purgeExpiredDeletedBills(deletedBills.value);
  settingsPopup.value = false;
  recyclePopup.value = true;
}

function restoreDeletedBill(id: string) {
  const bill = deletedBills.value.find((item) => item.id === id);
  if (!bill) return;
  const { deletedAt: _deletedAt, ...restoredBill } = bill;
  bills.value.unshift({
    ...restoredBill,
    id: bills.value.some((item) => item.id === restoredBill.id) ? createId("bill") : restoredBill.id,
    updatedAt: new Date().toISOString(),
  });
  deletedBills.value = deletedBills.value.filter((item) => item.id !== id);
  recyclePopup.value = false;
  showToast("账单已恢复");
}

function purgeDeletedBill(id: string) {
  deletedBills.value = deletedBills.value.filter((bill) => bill.id !== id);
  showToast("已彻底删除");
}

function removeItem(id: string) {
  if (!activeBill.value) return;
  activeBill.value.items = activeBill.value.items.filter((item) => item.id !== id);
  touchActiveBill();
}

function removeActiveBill() {
  if (!activeBill.value) return;
  const currentBill = activeBill.value;
  const billName = currentBill.name || "未命名账单";
  showConfirmDialog({
    title: "删除账单",
    message: `确认将「${billName}」移入回收站吗？一周内可恢复。`,
    width: "260px",
  }).then(() => {
    const deletedBill = {
      ...currentBill,
      deletedAt: new Date().toISOString(),
    };
    deletedBills.value = [deletedBill, ...deletedBills.value.filter((bill) => bill.id !== deletedBill.id)];
    bills.value = bills.value.filter((bill) => bill.id !== activeBillId.value);
    activeBillId.value = "";
    showToast("账单已移入回收站");
  }).catch(() => {
  });
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function updateScrollTopVisibility() {
  showScrollTop.value = window.scrollY > SCROLL_TOP_THRESHOLD;
}

init();

onMounted(() => {
  updateScrollTopVisibility();
  window.addEventListener("scroll", updateScrollTopVisibility, { passive: true });
});

onUnmounted(() => {
  window.removeEventListener("scroll", updateScrollTopVisibility);
});
</script>

<style lang="scss" scoped>
.home-page {
  min-height: 100vh;
  padding: 16px;
  background: var(--page-bg);
  color: var(--text-main);
  font-variant-numeric: tabular-nums;
}

.home-page,
.home-page * {
  box-sizing: border-box;
}

.home-page button {
  font: inherit;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.bill-list-view,
.bill-detail-view {
  width: min(100%, 780px);
  margin: 0 auto;
}

/* ---------- list header ---------- */
.page-header {
  position: sticky;
  top: 0;
  z-index: 20;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 14px 12px;
  margin: -16px -16px 14px;
  padding: 18px max(16px, calc((100vw - 780px) / 2)) 8px;
  background: var(--page-bg);
}

.header-title {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 4px 10px;
}

.page-header h1 {
  margin: 0;
  color: var(--text-strong);
  font-size: 28px;
  line-height: 1.1;
  letter-spacing: 0.5px;
  white-space: nowrap;
}

.header-bill-count {
  padding: 2px 9px;
  border-radius: 999px;
  background: var(--accent-soft);
  color: var(--accent-strong);
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-icon,
.round-icon-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  width: 42px;
  height: 42px;
  padding: 0;
  border: 0;
  border-radius: 14px;
  background: var(--surface);
  box-shadow: var(--shadow);
  color: var(--accent-strong);
  font-size: 18px;
  transition: background 0.2s ease, color 0.2s ease;
}

.header-icon:is(:hover, :focus-visible),
.round-icon-button:is(:hover, :focus-visible) {
  background: var(--accent-soft);
}

.round-icon-button.is-danger {
  color: var(--text-subtle);
}

.round-icon-button.is-danger:is(:hover, :focus-visible) {
  background: var(--danger-bg);
  color: var(--danger-text);
}

.bill-toolbar {
  grid-column: 1 / -1;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 10px;
}

.bill-search {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 46px;
  padding: 0 14px;
  border: 1.5px solid transparent;
  border-radius: 14px;
  background: var(--surface);
  box-shadow: var(--shadow);
  color: var(--text-subtle);
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.bill-search:focus-within {
  border-color: var(--accent);
  box-shadow: 0 0 0 4px var(--accent-ring);
}

.bill-search input {
  flex: 1;
  min-width: 0;
  height: 100%;
  padding: 0;
  border: 0;
  outline: none;
  background: transparent;
  color: var(--text-strong);
  font-size: 15px;
}

.bill-search input::placeholder {
  color: var(--text-subtle);
}

.add-bill-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 46px;
  padding: 0 16px;
  border: 0;
  border-radius: 14px;
  background: var(--hero-bg);
  box-shadow: var(--hero-shadow);
  color: #fff;
  font-size: 14px;
  font-weight: 700;
  white-space: nowrap;
}

.add-bill-button .el-icon {
  font-size: 16px;
}

/* ---------- bill cards ---------- */
.bill-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.bill-card {
  position: relative;
  display: flex;
  flex-direction: column;
  min-width: 0;
  padding: 16px 16px 14px;
  overflow: hidden;
  border: 0;
  border-radius: 18px;
  background: var(--surface);
  box-shadow: var(--shadow);
  color: var(--text-main);
  text-align: left;
  overflow-wrap: anywhere;
  transition: transform 0.15s ease;
}

.bill-card:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

.bill-card:active {
  transform: scale(0.98);
}

.bill-card-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.bill-card-name {
  min-width: 0;
  color: var(--text-strong);
  font-size: 15px;
  font-weight: 600;
  line-height: 1.35;
}

.bill-card-balance-mark {
  display: inline-grid;
  place-items: center;
  flex: 0 0 22px;
  height: 22px;
  border-radius: 7px;
  background: var(--accent-soft);
  color: var(--accent-strong);
  font-size: 12px;
  font-weight: 600;
  line-height: 1;
}

.bill-card-amount {
  margin-top: 12px;
  color: var(--accent-strong);
  font-size: clamp(22px, 7vw, 30px);
  line-height: 1.1;
}

.usage-bar {
  display: block;
  height: 5px;
  margin-top: 12px;
  overflow: hidden;
  border-radius: 999px;
  background: var(--surface-muted);
}

.usage-bar > span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: var(--hero-bg);
  transition: width 0.3s ease;
}

.usage-bar.is-light {
  margin-top: 0;
  background: rgba(255, 255, 255, 0.2);
}

.usage-bar.is-light > span {
  background: #fff;
}

.bill-card-footer {
  display: flex;
  justify-content: space-between;
  gap: 6px;
  margin-top: auto;
  padding-top: 8px;
  color: var(--text-subtle);
  font-size: 12px;
  line-height: 1.4;
}

.bill-card.is-empty {
  background: var(--surface-soft);
  box-shadow: none;
}

.bill-card.is-empty .bill-card-amount,
.bill-card.is-empty .bill-card-name {
  color: var(--text-subtle);
}

.bill-card.is-empty .usage-bar > span {
  background: var(--text-subtle);
  opacity: 0.4;
}

.empty-state {
  display: grid;
  place-items: center;
  gap: 8px;
  padding: 40px 12px;
  border-radius: 18px;
  background: var(--surface);
  text-align: center;
}

.empty-state.compact {
  padding: 22px 12px;
  background: transparent;
}

.empty-state strong {
  color: var(--text-strong);
}

.empty-state span {
  color: var(--text-muted);
  font-size: 12px;
}

/* ---------- detail ---------- */
.bill-detail-view {
  display: grid;
  gap: 18px;
}

.detail-topbar {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 12px;
}

.detail-topbar-title {
  color: var(--text-strong);
  font-size: 16px;
  font-weight: 600;
  text-align: center;
}

.hero-card {
  position: relative;
  display: grid;
  gap: 16px;
  padding: 22px 22px 20px;
  overflow: hidden;
  border-radius: 24px;
  background: var(--hero-bg);
  box-shadow: var(--hero-shadow);
  color: #fff;
}

.hero-card::before {
  content: "";
  position: absolute;
  top: -80px;
  right: -60px;
  width: 220px;
  height: 220px;
  border-radius: 50%;
  background: radial-gradient(circle, var(--hero-glow) 0%, transparent 70%);
  pointer-events: none;
}

.hero-card > * {
  position: relative;
}

.hero-name-input,
.budget-input,
.price-input,
.item-note-input {
  min-width: 0;
  margin: 0;
  border: 0;
  outline: none;
  background: transparent;
  color: inherit;
  font: inherit;
  appearance: textfield;
}

.hero-name-input::-webkit-inner-spin-button,
.budget-input::-webkit-inner-spin-button,
.budget-input::-webkit-outer-spin-button,
.price-input::-webkit-inner-spin-button,
.price-input::-webkit-outer-spin-button {
  appearance: none;
  margin: 0;
}

.hero-name-input {
  justify-self: start;
  width: auto;
  max-width: 100%;
  min-width: 4em;
  padding: 4px 10px;
  margin-left: -10px;
  border: 1.5px dashed rgba(255, 255, 255, 0.38);
  border-radius: 10px;
  font-size: 20px;
  font-weight: 700;
  field-sizing: content;
  transition: background 0.2s ease, border-color 0.2s ease;
}

.hero-name-input::placeholder,
.budget-input::placeholder {
  color: rgba(255, 255, 255, 0.55);
  font-weight: 400;
}

.hero-name-input:focus,
.balance-stat.is-editable:focus-within {
  border-style: solid;
  border-color: rgba(255, 255, 255, 0.85);
  background: rgba(255, 255, 255, 0.14);
}

.balance-main {
  display: grid;
  gap: 4px;
}

.balance-main span,
.balance-stat > span:first-child,
.hero-usage > span:last-child {
  color: rgba(255, 255, 255, 0.75);
  font-size: 13px;
}

.balance-main strong {
  font-size: clamp(36px, 11vw, 48px);
  line-height: 1.1;
  letter-spacing: -0.5px;
  overflow-wrap: anywhere;
}

.hero-usage {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;
}

.hero-usage > span:last-child {
  font-size: 12px;
}

.balance-breakdown {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.balance-stat {
  display: grid;
  gap: 4px;
  min-width: 0;
  padding: 10px 14px;
  border: 1.5px solid transparent;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.12);
  transition: background 0.2s ease, border-color 0.2s ease;
}

.balance-stat.is-editable {
  border-style: dashed;
  border-color: rgba(255, 255, 255, 0.38);
  cursor: text;
}

.balance-value {
  display: flex;
  align-items: center;
  gap: 2px;
  min-width: 0;
  color: #fff;
  font-size: 19px;
  font-weight: 700;
  line-height: 1.4;
  overflow-wrap: anywhere;
}

.budget-input {
  width: 100%;
  padding: 0;
  font-weight: 700;
}

/* ---------- items ---------- */
.section-row,
.items-heading {
  display: flex;
  align-items: center;
}

.section-row {
  justify-content: space-between;
  gap: 8px;
  padding-inline: 2px;
}

.items-heading {
  gap: 8px;
}

.items-heading h2 {
  margin: 0;
  color: var(--text-strong);
  font-size: 18px;
}

.items-heading span {
  padding: 2px 9px;
  border-radius: 999px;
  background: var(--accent-soft);
  color: var(--accent-strong);
  font-size: 12px;
  font-weight: 600;
}

.add-item-row {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 36px;
  padding: 0 14px;
  border: 0;
  border-radius: 999px;
  background: var(--accent-soft);
  color: var(--accent-strong);
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
}

.items-tip {
  margin: 6px 2px 12px;
  color: var(--text-subtle);
  font-size: 12px;
}

.items-empty {
  margin: 0;
  padding: 32px 0;
  border-radius: 18px;
  background: var(--surface);
  color: var(--text-subtle);
  font-size: 13px;
  text-align: center;
}

.item-list {
  display: grid;
  gap: 10px;
}

.item-swipe {
  overflow: hidden;
  border-radius: 16px;
  background: var(--surface);
  box-shadow: var(--shadow);
}

.item-row {
  display: grid;
  grid-template-columns: 32px minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;
  min-height: 64px;
  padding: 10px 12px 10px 14px;
}

.item-index {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border-radius: 10px;
  background: var(--accent-soft);
  color: var(--accent-strong);
  font-size: 13px;
  font-weight: 700;
}

.item-content {
  min-width: 0;
}

.item-note,
.item-note-input {
  display: block;
  width: 100%;
  height: 34px;
  padding: 0 10px;
  border: 1.5px dashed transparent;
  border-radius: 10px;
  color: var(--text-main);
  font-size: 15px;
  line-height: 31px;
  text-align: left;
}

.item-note {
  overflow: hidden;
  background: transparent;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-note.is-placeholder {
  border-color: var(--divider);
  color: var(--text-subtle);
  font-size: 13px;
}

.item-note-input {
  border-style: solid;
  border-color: var(--accent);
  background: var(--surface);
  box-shadow: 0 0 0 3px var(--accent-ring);
}

.item-amount {
  display: flex;
  align-items: center;
  gap: 2px;
  height: 38px;
  padding: 0 10px;
  border: 1.5px dashed var(--accent-border);
  border-radius: 10px;
  background: var(--accent-soft);
  color: var(--accent-strong);
  font-size: 14px;
  font-weight: 700;
  cursor: text;
  transition: border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
}

.item-amount:focus-within {
  border-style: solid;
  border-color: var(--accent);
  background: var(--surface);
  box-shadow: 0 0 0 3px var(--accent-ring);
}

.price-input {
  width: 5.5em;
  padding: 0;
  font-size: 18px;
  font-weight: 700;
  text-align: right;
}

.price-input::placeholder,
.item-note-input::placeholder {
  color: var(--text-subtle);
  font-size: 13px;
  font-weight: 400;
}

.swipe-delete-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  width: 72px;
  height: 100%;
  border: 0;
  background: var(--swipe-delete-bg);
  color: #fff;
  font-size: 13px;
  font-weight: 700;
}


.home-page :deep(.van-popup) {
  background: var(--surface);
  color: var(--text-main);
}

.recycle-popup {
  max-height: 78vh;
  overflow-y: auto;
}

.popup-head p {
  margin: 4px 0 0;
  color: var(--text-muted);
  font-size: 12px;
}

.recycle-list {
  display: grid;
  gap: 10px;
  margin-top: 14px;
}

.recycle-item {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 12px;
  align-items: center;
  padding: 12px;
  border-radius: 12px;
  background: var(--surface-soft);
}

.recycle-item strong,
.recycle-item span {
  display: block;
}

.recycle-item strong {
  color: var(--text-strong);
}

.recycle-item span {
  margin-top: 4px;
  color: var(--text-muted);
  font-size: 12px;
}

.recycle-actions {
  display: flex;
  gap: 8px;
}

.recycle-actions button {
  height: 34px;
  padding: 0 12px;
  border: 0;
  border-radius: 999px;
  background: var(--header-icon-bg);
  color: var(--accent);
  font-size: 12px;
  font-weight: 700;
}

.recycle-actions button.danger {
  background: var(--danger-bg);
  color: var(--danger-text);
}

@media (max-width: 520px) {
  .home-page {
    padding: 12px;
  }

  .page-header {
    margin: -12px -12px 12px;
    padding: 14px 12px 6px;
  }

  .page-header h1 {
    font-size: 26px;
  }

  .hero-card {
    padding: 20px 18px 18px;
  }

  .recycle-item {
    grid-template-columns: 1fr;
  }

  .recycle-actions {
    justify-content: flex-end;
  }
}
</style>
