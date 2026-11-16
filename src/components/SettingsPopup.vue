<template>
  <van-popup v-model:show="popupShow" position="bottom" round destroy-on-close>
    <div class="popup-body">
      <div class="popup-head">
        <div>
          <h3>设置</h3>
          <p>主题与数据管理</p>
        </div>
      </div>

      <div class="theme-panel">
        <div class="section-label">
          <strong>界面主题</strong>
          <span>{{ currentThemeName }}</span>
        </div>
        <div class="theme-options">
          <button
            v-for="theme in themeOptions"
            :key="theme.key"
            class="theme-option"
            :class="{ active: currentTheme === theme.key }"
            type="button"
            @click="emit('set-theme', theme.key)"
          >
            <span v-if="currentTheme === theme.key" class="theme-check" aria-hidden="true">
              <el-icon><Check /></el-icon>
            </span>
            <span class="theme-swatch" :style="{ background: theme.swatch }"></span>
            <span>
              <strong>{{ theme.name }}</strong>
              <em>{{ theme.caption }}</em>
            </span>
          </button>
        </div>
      </div>

      <div class="settings-group">
        <div class="section-label">
          <strong>数据管理</strong>
        </div>
        <div class="settings-list">
          <button class="settings-item" type="button" @click="emit('export')">
            <span class="settings-item-icon">
              <el-icon><Download /></el-icon>
            </span>
            <span>
              <strong>导出总数据</strong>
              <em>下载会员账单备份文件</em>
            </span>
            <el-icon class="settings-arrow"><ArrowRight /></el-icon>
          </button>

          <button class="settings-item" type="button" @click="emit('open-import')">
            <span class="settings-item-icon">
              <el-icon><Upload /></el-icon>
            </span>
            <span>
              <strong>导入总数据</strong>
              <em>上传备份文件后恢复账单</em>
            </span>
            <el-icon class="settings-arrow"><ArrowRight /></el-icon>
          </button>

          <button class="settings-item" type="button" @click="emit('open-recycle')">
            <span class="settings-item-icon">
              <el-icon><RefreshLeft /></el-icon>
            </span>
            <span>
              <strong>回收站</strong>
              <em>删除的账单一周内可恢复</em>
            </span>
            <span class="settings-badge">{{ recycleCount }}</span>
          </button>
        </div>

        <div class="settings-list danger">
          <button class="settings-item settings-item-feature danger" type="button" @click="emit('reset')">
            <span class="settings-item-icon">
              <el-icon><Delete /></el-icon>
            </span>
            <span>
              <strong>重置数据</strong>
              <em>清除全部会员账单</em>
            </span>
            <el-icon class="settings-arrow"><ArrowRight /></el-icon>
          </button>
        </div>
      </div>
    </div>
  </van-popup>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { ArrowRight, Check, Delete, Download, RefreshLeft, Upload } from "@element-plus/icons-vue";
import type { ThemeKey, ThemeOption } from "@/config/themes";

const props = defineProps<{
  show: boolean;
  themeOptions: ThemeOption[];
  currentTheme: ThemeKey;
  currentThemeName: string;
  recycleCount: number;
}>();

const emit = defineEmits<{
  "update:show": [value: boolean];
  "set-theme": [theme: ThemeKey];
  export: [];
  "open-import": [];
  "open-recycle": [];
  reset: [];
}>();

const popupShow = computed({
  get: () => props.show,
  set: (value: boolean) => emit("update:show", value),
});
</script>

<style lang="scss" scoped>
.theme-panel {
  margin-top: 18px;
}

.section-label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin: 0 2px 10px;
  color: var(--text-subtle);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.04em;
}

.section-label span {
  padding: 2px 9px;
  border-radius: 999px;
  background: var(--accent-soft);
  color: var(--accent-strong);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0;
}

.theme-options {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.theme-option {
  position: relative;
  display: grid;
  justify-items: center;
  gap: 8px;
  min-width: 0;
  padding: 14px 6px 12px;
  border: 1.5px solid var(--divider);
  border-radius: 16px;
  background: var(--surface);
  text-align: center;
  cursor: pointer;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.theme-option.active {
  border-color: var(--accent);
  box-shadow: 0 0 0 4px var(--accent-ring);
}

.theme-check {
  position: absolute;
  top: 8px;
  right: 8px;
  display: grid;
  place-items: center;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--accent);
  color: #fff;
  font-size: 11px;
}

.theme-swatch {
  width: 40px;
  height: 40px;
  border-radius: 14px;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.48), 0 6px 14px rgba(0, 0, 0, 0.12);
}

.theme-option strong,
.theme-option em {
  display: block;
}

.theme-option strong {
  color: var(--text-strong);
  font-size: 14px;
}

.theme-option em {
  margin-top: 2px;
  color: var(--text-subtle);
  font-size: 11px;
  font-style: normal;
  line-height: 1.3;
}

.settings-group {
  margin-top: 20px;
}

.settings-list {
  overflow: hidden;
  border-radius: 16px;
  background: var(--surface-soft);
}

.settings-item {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 12px 14px;
  border: 0;
  background: transparent;
  text-align: left;
  cursor: pointer;
}

.settings-item + .settings-item {
  border-top: 1px solid var(--divider);
}

.settings-item:is(:hover, :active) {
  background: var(--accent-soft);
}

.settings-item strong,
.settings-item em {
  display: block;
}

.settings-item strong {
  color: var(--text-strong);
  font-size: 15px;
}

.settings-item em {
  margin-top: 2px;
  color: var(--text-subtle);
  font-size: 12px;
  font-style: normal;
  line-height: 1.35;
}

.settings-arrow {
  color: var(--text-subtle);
  font-size: 14px;
}

.settings-badge {
  min-width: 22px;
  padding: 2px 8px;
  border-radius: 999px;
  background: var(--accent-soft);
  color: var(--accent-strong);
  font-size: 12px;
  font-weight: 700;
  text-align: center;
}

.settings-list.danger {
  margin-top: 12px;
  background: var(--danger-bg);
}

.settings-list.danger .settings-item:is(:hover, :active) {
  background: color-mix(in srgb, var(--danger-text) 10%, var(--danger-bg));
}

.settings-list.danger strong {
  color: var(--danger-text);
}
</style>
