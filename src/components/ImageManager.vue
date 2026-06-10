<template>
  <div>

    <div class="grid">
      <div v-for="(img, i) in modelValue" :key="i" class="card">
        <img :src="img" />

        <div class="actions">
          <button aria-label="Remover imagem" @click="remover(i)">✕</button>
          <button aria-label="Mover para cima" @click="subir(i)">↑</button>
          <button aria-label="Mover para baixo" @click="descer(i)">↓</button>
        </div>
      </div>
    </div>

    <input type="file" accept="image/*" :disabled="enviando" @change="onFileSelect" />

    <p v-if="enviando" class="enviando">Enviando imagem...</p>

    <ImageCropper
      v-if="cropperSrc"
      :src="cropperSrc"
      @cancel="cropperSrc = null"
      @crop="onCrop"
    />

  </div>
</template>

<script>
import { supabase } from '../services/supabase'
import ImageCropper from './ImageCropper.vue'

export default {
  components: { ImageCropper },
  
  props: { modelValue: { type: Array, default: () => [] } },
  emits: ['update:modelValue'],

  data() {
    return {
      cropperSrc: null,
      pendingFile: null,
      enviando: false,
    }
  },

  methods: {
    atualizar(v) {
      this.$emit('update:modelValue', v)
    },

    onFileSelect(e) {
      const file = e.target.files[0]
      if (!file) return

      const reader = new FileReader()
      reader.onload = (evt) => {
        this.cropperSrc = evt.target.result
        this.pendingFile = file
      }
      reader.readAsDataURL(file)
      e.target.value = ''
    },

    async onCrop(blob) {
      const file = this.pendingFile
      this.cropperSrc = null
      this.pendingFile = null

      if (!file) return

      this.enviando = true

      try {
        const sanitizeFileName = (name) => {
          return name
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/\s+/g, "_")
            .replace(/[^a-zA-Z0-9._-]/g, "")
        }

        const cleanName = sanitizeFileName(file.name)
        const tipo = this.$parent.local?.tipo || 'outros'
        const path = `${tipo}/${Date.now()}-${cleanName}`

        const { error } = await supabase.storage
          .from('products')
          .upload(path, blob, { upsert: true })

        if (error) {
          console.error(error)
          alert(error.message)
          return
        }

        const { data } = supabase.storage
          .from('products')
          .getPublicUrl(path)

        this.atualizar([...this.modelValue, data.publicUrl])
      } finally {
        this.enviando = false
      }
    },

    remover(i) {
      const arr = [...this.modelValue]
      arr.splice(i, 1)
      this.atualizar(arr)
    },

    subir(i) {
      if (i === 0) return
      const arr = [...this.modelValue]
      ;[arr[i], arr[i-1]] = [arr[i-1], arr[i]]
      this.atualizar(arr)
    },

    descer(i) {
      const arr = [...this.modelValue]
      if (i === arr.length - 1) return
      ;[arr[i], arr[i+1]] = [arr[i+1], arr[i]]
      this.atualizar(arr)
    }
  }
}
</script>

<style scoped>
.grid {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.card {
  position: relative;
  width: 100px;
  height: 100px;
  border-radius: 14px;
  overflow: hidden;
  border: 1px solid var(--border);
  background: var(--surface-soft);
}

img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.actions {
  position: absolute;
  top: 4px;
  right: 4px;
  display: flex;
  gap: 4px;
}

.actions button {
  width: 24px;
  height: 24px;
  min-height: auto;
  border: 1px solid rgba(255, 255, 255, 0.7);
  border-radius: 8px;
  background: rgba(15, 23, 42, 0.72);
  color: white;
  cursor: pointer;
}

input[type='file'] {
  margin-top: 12px;
  padding: 10px;
  border-radius: 12px;
  border: 1px dashed var(--border-strong);
  background: var(--surface-soft);
}

input[type='file']:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.enviando {
  margin-top: 8px;
  font-size: 12px;
  color: var(--primary);
  font-weight: 600;
}
</style>