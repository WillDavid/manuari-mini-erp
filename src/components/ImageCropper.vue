<template>
  <div class="cropper-overlay">
    <div class="cropper-modal">
      <div class="cropper-header">
        <h4>Cortar Imagem</h4>
        <button class="close" @click="$emit('cancel')">✕</button>
      </div>
      
      <div class="cropper-body">
        <Cropper
          ref="cropperRef"
          class="cropper"
          :src="src"
          :stencil-props="{
            aspectRatio: 1,
            movable: true,
            resizable: false
          }"
          :canvas-props="{
            minimumCropCanvasWidth: 800,
            minimumCropCanvasHeight: 800
          }"
          image-restriction="stencil"
        />
      </div>

      <div class="cropper-footer">
        <button class="btn ghost" @click="$emit('cancel')">Cancelar</button>
        <button class="btn primary" @click="save">Salvar Corte</button>
      </div>
    </div>
  </div>
</template>

<script>
import { Cropper } from 'vue-advanced-cropper'
import 'vue-advanced-cropper/dist/style.css'

export default {
  components: { Cropper },
  
  props: ['src'],
  emits: ['cancel', 'crop'],

  methods: {
    save() {
      const { canvas } = this.$refs.cropperRef.getResult()
      
      canvas.toBlob((blob) => {
        this.$emit('crop', blob)
      }, 'image/jpeg', 0.9)
    }
  }
}
</script>

<style scoped>
.cropper-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(15, 23, 42, 0.85);
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
}

.cropper-modal {
  background: var(--surface);
  border-radius: var(--radius-md);
  border: 1px solid rgba(255, 255, 255, 0.35);
  width: 90%;
  max-width: 900px;
  overflow: hidden;
  opacity: 1 !important;
  box-shadow: var(--shadow-md);
}

.cropper-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 18px;
  border-bottom: 1px solid var(--border);
}

.cropper-header h4 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.close {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: var(--surface-soft);
  border: 1px solid var(--border);
  cursor: pointer;
  color: var(--text-muted);
}

.cropper-body {
  padding: 20px;
  background: var(--surface);
}

.cropper {
  height: 500px;
  background: var(--surface);
}

.cropper-footer {
  display: flex;
  gap: 10px;
  padding: 14px 18px;
  border-top: 1px solid var(--border);
  justify-content: flex-end;
}

.btn {
  padding: 10px 16px;
  border-radius: 10px;
  border: none;
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;
}

.btn.primary {
  background: linear-gradient(135deg, var(--primary), var(--primary-hover));
  color: white;
}

.btn.ghost {
  background: var(--surface-soft);
  border: 1px solid var(--border);
  color: var(--text-muted);
}
</style>