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
          <time class="bill-card-date" :datetime="bill.updatedAt" :title="formatBillUpdatedAt(bill.updatedAt)">
            {{ formatBillUpdatedAt(bill.updatedAt, true) }}
          </time>
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
      <section class="bill-editor" aria-label="账单概览">
        <div class="title-field">
          <button class="detail-back-button" type="button" aria-label="返回账单列表" title="返回账单列表" @click="closeBill">
            <el-icon aria-hidden="true"><Back /></el-icon>
          </button>
          <label class="editable-name">
            <input v-model.trim="activeBill.name" class="text-input title-input" aria-label="账单名" placeholder="账单名" @input="touchActiveBill" />
            <el-icon aria-hidden="true"><EditPen /></el-icon>
          </label>
          <button class="bill-delete-button" type="button" aria-label="删除账单" title="删除账单" @click="removeActiveBill">
            <el-icon aria-hidden="true"><Delete /></el-icon>
          </button>
        </div>

        <div class="balance-card">
          <div class="balance-main">
            <span>剩余金额</span>
            <strong>¥{{ formatMoney(activeBillRemaining) }}</strong>
          </div>
          <div class="balance-breakdown">
            <label class="balance-stat">
              <span>总充值</span>
              <span class="editable-budget">
                <span aria-hidden="true">¥</span>
                <input
                  v-model.number="activeBill.totalAmount"
                  class="text-input budget-input"
                  type="number"
                  inputmode="decimal"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  @input="touchActiveBill"
                />
                <el-icon aria-hidden="true"><EditPen /></el-icon>
              </span>
            </label>
            <div class="balance-stat">
              <span>累计消费</span>
              <strong>¥{{ formatMoney(activeBillTotal) }}</strong>
            </div>
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

        <p v-if="!activeBill.items.length" class="items-empty">暂无消费记录</p>
        <div v-else class="item-list">
          <van-swipe-cell v-for="item in activeBill.items" :key="item.id" class="item-swipe">
            <div class="item-row">
              <div class="item-content">
                <label class="item-amount">
                  <span aria-hidden="true">¥</span>
                  <input
                    v-model.number="item.price"
                    class="text-input price-input"
                    aria-label="金额"
                    type="number"
                    inputmode="decimal"
                    min="0"
                    step="0.01"
                    placeholder="输入金额"
                    @input="touchActiveBill"
                  />
                </label>
                <input
                  v-if="editingNoteId === item.id"
                  v-focus-note
                  v-model.trim="item.name"
                  class="text-input item-note-input"
                  aria-label="备注（选填）"
                  placeholder="备注（选填）"
                  @input="touchActiveBill"
                  @blur="editingNoteId = null"
                  @keydown.enter="finishItemNote"
                />
                <p v-else-if="item.name.trim()" class="item-note">{{ item.name }}</p>
              </div>
              <button
                class="item-note-button"
                type="button"
                :aria-label="item.name.trim() ? '编辑备注' : '添加备注'"
                :title="item.name.trim() ? '编辑备注' : '添加备注'"
                @click="editingNoteId = item.id"
              >
                <el-icon aria-hidden="true"><EditPen /></el-icon>
              </button>
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
import { Back, Delete, EditPen, Plus, Search, Setting, Top } from "@element-plus/icons-vue";
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
  padding: 12px;
  background: var(--page-bg);
  color: var(--text-main);
}

.home-page,
.home-page * {
  box-sizing: border-box;
}

.bill-list-view,
.bill-detail-view {
  width: min(100%, 780px);
  margin: 0 auto;
}

.page-header {
  position: sticky;
  top: 0;
  z-index: 20;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;
  margin: -12px -12px 12px;
  padding: 16px max(12px, calc((100vw - 780px) / 2)) 4px;
  background: var(--page-bg);
}

.header-title {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 4px 12px;
}

.page-header h1 {
  margin: 0;
  color: var(--text-strong);
  font-size: 28px;
  line-height: 1.08;
  white-space: nowrap;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.bill-toolbar {
  grid-column: 1 / -1;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 8px;
}

.bill-search {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 12px;
  border: 1px solid var(--divider);
  border-radius: 12px;
  background: var(--surface);
  color: var(--text-subtle);
}

.bill-search:focus-within {
  border-color: var(--accent);
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
  font-size: 16px;
}

.bill-search input::placeholder {
  color: var(--text-subtle);
}

.header-icon,
.add-bill-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border: 0;
  border-radius: 999px;
  background: var(--header-icon-bg);
  color: var(--accent);
  font-size: 18px;
}

.add-bill-button {
  width: auto;
  gap: 6px;
  padding: 0 14px;
  border-radius: 12px;
  background: var(--accent-strong);
  color: #fff;
  font-size: 13px;
  font-weight: 700;
  white-space: nowrap;
}

.add-bill-button .el-icon {
  font-size: 16px;
}

.bill-editor,
.items-panel {
  padding: 16px 20px 20px;
  border-radius: 16px;
  background: var(--surface);
}

.header-bill-count {
  white-space: nowrap;
}

.header-bill-count,
.empty-state span {
  color: var(--text-muted);
  font-size: 12px;
}

.bill-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.bill-card {
  display: flex;
  flex-direction: column;
  min-width: 0;
  padding: 14px 16px;
  border: 0;
  border-radius: 14px;
  background: var(--surface);
  color: var(--text-main);
  font: inherit;
  text-align: left;
  overflow-wrap: anywhere;
  cursor: pointer;
}

.bill-card:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

.bill-card:is(:hover, :active) {
  background: color-mix(in srgb, var(--accent) 5%, var(--surface));
}

.bill-card-heading {
  display: flex;
  align-items: flex-start;
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
  background: color-mix(in srgb, var(--accent) 8%, var(--surface));
  color: var(--accent-strong);
  font-size: 12px;
  font-weight: 600;
  line-height: 1;
}

.bill-card-date {
  color: var(--text-subtle);
  font-size: 12px;
  line-height: 1.4;
}

.bill-card-amount {
  margin-top: 10px;
  color: var(--accent-strong);
  font-size: clamp(22px, 7.5vw, 32px);
  font-variant-numeric: tabular-nums;
  line-height: 1.1;
}

.bill-card-date {
  margin-top: auto;
  padding-top: 8px;
  font-variant-numeric: tabular-nums;
}

.bill-card.is-empty {
  background: var(--surface-soft);
}

.bill-card.is-empty .bill-card-amount {
  color: var(--text-subtle);
}

.empty-state {
  display: grid;
  place-items: center;
  gap: 8px;
  padding: 34px 12px;
  text-align: center;
}

.empty-state.compact {
  padding: 22px 12px;
}

.empty-state strong {
  color: var(--text-strong);
}

.bill-detail-view {
  display: grid;
  gap: 16px;
}

.title-field,
.editable-name,
.editable-budget,
.section-row,
.items-heading {
  display: flex;
  align-items: center;
}

.title-field {
  gap: 8px;
  margin-bottom: 12px;
}

.editable-name,
.editable-budget {
  min-width: 0;
  gap: 4px;
  cursor: text;
}

.editable-name .el-icon,
.editable-budget .el-icon {
  flex-shrink: 0;
  color: var(--text-subtle);
  font-size: 14px;
  pointer-events: none;
}

.detail-back-button,
.bill-delete-button,
.item-note-button,
.add-item-row {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  border: 0;
  border-radius: 10px;
  background: transparent;
  cursor: pointer;
}

.detail-back-button,
.bill-delete-button,
.item-note-button {
  flex: 0 0 44px;
  padding: 0;
  color: var(--text-subtle);
  font-size: 17px;
}

.detail-back-button {
  border-radius: 50%;
  background: var(--surface-soft);
  color: var(--text-main);
}

.bill-delete-button {
  margin-left: auto;
}

.detail-back-button:is(:hover, :focus-visible),
.item-note-button:is(:hover, :focus-visible) {
  background: var(--header-icon-bg);
  color: var(--accent-strong);
}

.bill-delete-button:is(:hover, :focus-visible) {
  background: var(--danger-bg);
  color: var(--danger-text);
}

.text-input {
  width: 100%;
  min-width: 0;
  min-height: 44px;
  padding: 0 6px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: var(--text-main);
  font: inherit;
  font-size: 16px;
}

.text-input::placeholder {
  color: var(--text-subtle);
  font-size: 0.9em;
  font-weight: 400;
}

.text-input:focus {
  outline: 2px solid var(--accent);
  outline-offset: -2px;
  background: var(--surface);
}

.text-input[type="number"] {
  appearance: textfield;
}

.text-input::-webkit-inner-spin-button,
.text-input::-webkit-outer-spin-button {
  appearance: none;
  margin: 0;
}

.title-input {
  color: var(--text-strong);
  font-size: 24px;
  font-weight: 700;
  field-sizing: content;
}

.balance-card {
  display: grid;
  gap: 20px;
  padding: 20px;
  border-radius: 14px;
  background: color-mix(in srgb, var(--accent) 8%, var(--surface));
}

.balance-main,
.balance-stat {
  display: grid;
  min-width: 0;
  gap: 4px;
  color: var(--text-subtle);
  font-size: 13px;
}

.balance-main strong {
  color: var(--accent-strong);
  font-size: clamp(32px, 9vw, 46px);
  font-variant-numeric: tabular-nums;
  line-height: 1.1;
  overflow-wrap: anywhere;
}

.balance-breakdown {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.editable-budget,
.balance-stat strong {
  min-height: 44px;
  color: var(--text-strong);
  font-size: 16px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.budget-input {
  width: auto;
  max-width: calc(100% - 30px);
  padding-inline: 1px;
  color: inherit;
  field-sizing: content;
}

.balance-stat strong {
  display: grid;
  align-items: center;
  overflow-wrap: anywhere;
}

.section-row {
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 8px;
}

.items-heading {
  gap: 8px;
}

.items-heading h2 {
  margin: 0;
  color: var(--text-strong);
  font-size: 18px;
}

.items-heading span,
.items-empty {
  color: var(--text-subtle);
  font-size: 13px;
}

.add-item-row {
  gap: 4px;
  padding: 0 8px;
  color: var(--accent-strong);
  font-size: 14px;
  font-weight: 600;
  white-space: nowrap;
}

.add-item-row:is(:hover, :focus-visible) {
  background: var(--header-icon-bg);
}

.items-empty {
  margin: 0;
  padding: 18px 0;
}

.item-row {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding-block: 6px;
}

.item-swipe {
  border-top: 1px solid var(--divider);
}

.item-content {
  flex: 1;
  min-width: 0;
}

.item-amount {
  display: flex;
  align-items: center;
  gap: 4px;
  color: var(--accent-strong);
  font-size: 16px;
  font-weight: 600;
}

.price-input {
  padding-inline: 2px;
  color: inherit;
  font-size: 20px;
  font-variant-numeric: tabular-nums;
  font-weight: 700;
}

.item-note {
  margin: -3px 0 6px;
  color: var(--text-subtle);
  font-size: 13px;
  line-height: 1.5;
  overflow-wrap: anywhere;
}

.item-note-input {
  color: var(--text-subtle);
}

.swipe-delete-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  width: 64px;
  height: 100%;
  margin-left: 8px;
  border: 0;
  border-radius: 8px;
  background: var(--danger-bg);
  color: var(--danger-text);
  font-size: 12px;
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
    padding: 10px;
  }

  .page-header {
    margin: -10px -10px 10px;
    padding: 12px 10px 4px;
  }

  .page-header h1 {
    font-size: 26px;
  }

  .header-icon {
    width: 42px;
  }

  .header-icon,
  .add-bill-button {
    height: 42px;
  }

  .bill-card {
    padding-inline: 12px;
  }

  .bill-editor,
  .items-panel {
    padding: 14px;
    border-radius: 12px;
  }

  .recycle-item {
    grid-template-columns: 1fr;
  }

  .recycle-actions {
    justify-content: flex-end;
  }
}
</style>
