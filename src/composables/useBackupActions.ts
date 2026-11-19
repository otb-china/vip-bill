import { ref, type Ref } from "vue";
import dayjs from "dayjs";
import { showConfirmDialog, showToast } from "vant";
import { storageKeys } from "@/utils/toolStorage";
import { LStorage, reportSaveError } from "@/utils/localStorage.ts";
import {
  createId,
  getBillUpdatedTime,
  mergeLatest,
  normalizeBills,
  normalizeDeletedBills,
} from "@/utils/billData.ts";
import type { Bill, DeletedBill, VipBillBackupData } from "@/types/bill";

interface UseBackupActionsOptions {
  bills: Ref<Bill[]>;
  deletedBills: Ref<DeletedBill[]>;
  settingsPopup: Ref<boolean>;
  dateFormat: string;
  initData: () => void;
}

export function useBackupActions(options: UseBackupActionsOptions) {
  const importExportInfo = ref({
    show: false,
  });
  const importInfo = ref({
    dataStr: "",
    fileName: "",
  });

  function openImportExport() {
    options.settingsPopup.value = false;
    importInfo.value.dataStr = "";
    importInfo.value.fileName = "";
    importExportInfo.value.show = true;
  }

  function createBackupData() {
    return {
      bills: options.bills.value,
      deletedBills: options.deletedBills.value,
    };
  }

  function exportAllData() {
    const backupText = JSON.stringify(createBackupData(), null, 2);
    const blob = new Blob([backupText], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const downloadLink = document.createElement("a");
    downloadLink.href = url;
    downloadLink.download = `vip-bill-backup-${dayjs(new Date()).format(options.dateFormat)}.json`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    URL.revokeObjectURL(url);
    options.settingsPopup.value = false;
    showToast("备份文件已导出");
  }

  function onImportFileLoaded(payload: { dataStr: string; fileName: string }) {
    importInfo.value.dataStr = payload.dataStr;
    importInfo.value.fileName = payload.fileName;
    showToast("备份文件已读取");
  }

  function resetAllData() {
    showConfirmDialog({
      title: "提示",
      message: "确认清除所有账单数据吗？",
      width: "250px",
    }).then(async () => {
      try {
        await Promise.all([LStorage.new(storageKeys.bills).remove(), LStorage.new(storageKeys.recycleBin).remove()]);
      } catch (error) {
        reportSaveError(error);
        return;
      }
      options.bills.value = [];
      options.deletedBills.value = [];
      options.settingsPopup.value = false;
      showToast("数据已重置");
    }).catch(() => {
    });
  }

  async function importData() {
    try {
      const parsedData = JSON.parse(importInfo.value.dataStr) as VipBillBackupData;
      if (!parsedData || typeof parsedData !== "object" || Array.isArray(parsedData)) {
        throw new Error("Invalid backup data");
      }
      const bills = normalizeBills(parsedData.bills, new Date(0).toISOString());
      const deletedBills = normalizeDeletedBills(parsedData.deletedBills);
      if (!Array.isArray(parsedData.bills) || bills.length !== parsedData.bills.length) {
        throw new Error("Invalid bills");
      }
      const currentBills = options.bills.value;
      const mergedBills = mergeLatest(currentBills, bills, (bill) => bill.name, getBillUpdatedTime);
      const mergedDeletedBills = mergeLatest(
        options.deletedBills.value,
        deletedBills,
        (bill) => bill.id,
        (bill) => Date.parse(bill.deletedAt) || 0,
      );

      // A renamed bill can share an ID with a different name in the backup.
      const currentNamesById = new Map(currentBills.map((bill) => [bill.id, bill.name]));
      const usedIds = new Set<string>();
      const uniqueBills = mergedBills.map((bill) => {
        const currentName = currentNamesById.get(bill.id);
        let id = bill.id;
        if (usedIds.has(id) || (currentName !== undefined && currentName !== bill.name)) {
          id = createId("bill");
        }
        usedIds.add(id);
        return id === bill.id ? bill : { ...bill, id };
      });

      await Promise.all([
        LStorage.new(storageKeys.bills).setter(uniqueBills),
        LStorage.new(storageKeys.recycleBin).setter(mergedDeletedBills),
      ]);
      options.initData();
      importExportInfo.value.show = false;
      importInfo.value.dataStr = "";
      importInfo.value.fileName = "";
      showToast("总数据导入成功");
    } catch (error) {
      showToast(error instanceof DOMException && error.name === "QuotaExceededError"
        ? "存储空间不足，导入的数据未保存，请保留备份文件"
        : "导入失败，请检查备份文件");
    }
  }

  return {
    importExportInfo,
    importInfo,
    openImportExport,
    createBackupData,
    exportAllData,
    onImportFileLoaded,
    resetAllData,
    importData,
  };
}
