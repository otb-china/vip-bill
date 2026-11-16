<template>
  <van-popup v-model:show="popupShow" position="bottom" destroy-on-close round>
    <div class="popup-body import-export-popup">
      <div class="popup-head">
        <div>
          <h3>导入总数据</h3>
          <p>备份账单会与当前账单合并，同名时保留更新时间较新的一条。</p>
        </div>
      </div>

      <div v-if="billCount" class="import-export-card">
        <div>
          <span>当前数据</span>
          <strong>{{ billCount }} 个账单</strong>
        </div>
      </div>

      <input
        ref="fileInput"
        class="file-input"
        type="file"
        accept="application/json,.json"
        @change="onFileChange"
      />

      <button class="file-upload-card" :class="{ 'is-ready': hasFile }" type="button" @click="selectFile">
        <span class="settings-item-icon">
          <el-icon><Upload /></el-icon>
        </span>
        <span>
          <strong>{{ fileName || "选择备份文件" }}</strong>
          <em>{{ hasFile ? "文件已读取，点击下方按钮导入" : "支持导出的 .json 备份文件" }}</em>
        </span>
      </button>

      <el-button
        type="primary"
        size="large"
        class="submit-button"
        :disabled="!hasFile"
        @click="emit('import')"
      >
        导入总数据
      </el-button>
    </div>
  </van-popup>
</template>

<script lang="ts" setup>
import { computed, ref } from "vue";
import { Upload } from "@element-plus/icons-vue";

const props = defineProps<{
  show: boolean;
  billCount: number;
  fileName: string;
  hasFile: boolean;
}>();

const emit = defineEmits<{
  "update:show": [value: boolean];
  "file-loaded": [payload: { dataStr: string; fileName: string }];
  "file-error": [message: string];
  import: [];
}>();

const fileInput = ref<HTMLInputElement | null>(null);

const popupShow = computed({
  get: () => props.show,
  set: (value: boolean) => emit("update:show", value),
});

const selectFile = () => {
  fileInput.value?.click();
};

const onFileChange = async (event: Event) => {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];

  if (!file) return;

  const isJsonFile = file.type === "application/json" || file.name.toLowerCase().endsWith(".json");
  if (!isJsonFile) {
    input.value = "";
    emit("file-error", "请选择 JSON 备份文件");
    return;
  }

  try {
    const dataStr = await file.text();
    emit("file-loaded", { dataStr, fileName: file.name });
  } catch {
    input.value = "";
    emit("file-error", "文件读取失败");
  }
};
</script>

<style lang="scss" scoped>
.file-input {
  display: none;
}

.import-export-card {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 16px;
  padding: 16px 18px;
  overflow: hidden;
  border-radius: 18px;
  background: var(--hero-bg);
  box-shadow: var(--hero-shadow);
  color: #fff;
}

.import-export-card::after {
  content: "";
  position: absolute;
  top: -50px;
  right: -40px;
  width: 140px;
  height: 140px;
  border-radius: 50%;
  background: radial-gradient(circle, var(--hero-glow) 0%, transparent 70%);
}

.import-export-card span,
.import-export-card strong {
  display: block;
}

.import-export-card span {
  font-size: 12px;
  opacity: 0.78;
}

.import-export-card strong {
  margin-top: 2px;
  font-size: 22px;
}

.file-upload-card {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  margin-top: 12px;
  padding: 16px;
  border: 1.5px dashed var(--accent-border);
  border-radius: 16px;
  background: var(--accent-soft);
  text-align: left;
  cursor: pointer;
  transition: border-color 0.2s ease;
}

.file-upload-card:is(:hover, :focus-visible) {
  border-color: var(--accent);
}

.file-upload-card.is-ready {
  border-style: solid;
  border-color: var(--accent);
}

.file-upload-card > span:last-child {
  min-width: 0;
}

.file-upload-card strong,
.file-upload-card em {
  display: block;
}

.file-upload-card strong {
  color: var(--text-strong);
  font-size: 15px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-upload-card em {
  margin-top: 3px;
  color: var(--text-subtle);
  font-size: 12px;
  font-style: normal;
  line-height: 1.35;
}
</style>
