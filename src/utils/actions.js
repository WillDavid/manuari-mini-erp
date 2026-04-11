const pendingOperations = new Map()

export function blockDuplicate(prefix) {
  return {
    operations: new Map(),
    isPending(operationKey) {
      const key = `${prefix}_${operationKey}`
      return this.operations.get(key) === true
    },
    start(operationKey) {
      const key = `${prefix}_${operationKey}`
      if (this.operations.get(key)) {
        return false
      }
      this.operations.set(key, true)
      return true
    },
    end(operationKey) {
      const key = `${prefix}_${operationKey}`
      this.operations.delete(key)
    }
  }
}

export const duplicateBlocker = blockDuplicate('global')

export function createActionHandler(component, options = {}) {
  const {
    actionName = 'acao',
    loadingData = 'isLoading',
    onSuccess = null,
    onError = null,
    successMessage = null,
    errorMessage = 'Operação falhou. Tente novamente.'
  } = options

  return async function(fn) {
    const comp = typeof component === 'function' ? component() : component
    
    if (!comp) return
    
    if (comp[loadingData]) {
      return
    }

    comp[loadingData] = true

    try {
      const result = await fn()
      
      if (successMessage) {
        alert(successMessage)
      }
      
      if (onSuccess) {
        onSuccess(result)
      }
      
      return result
    } catch (error) {
      console.error(`Erro em ${actionName}:`, error)
      
      if (errorMessage) {
        alert(errorMessage)
      }
      
      if (onError) {
        onError(error)
      }
      
      throw error
    } finally {
      comp[loadingData] = false
    }
  }
}

export function handleAsync(component, actionName, asyncFn, options = {}) {
  const {
    loadingData = 'isLoading',
    showSuccess = true,
    showError = true,
    successMsg = null,
    errorMsg = 'Operação falhou. Tente novamente.',
    onSuccess = null,
    onError = null
  } = options

  return async function(...args) {
    if (component[loadingData]) {
      return
    }

    component[loadingData] = true

    try {
      const result = await asyncFn(...args)
      
      if (showSuccess && successMsg) {
        alert(successMsg)
      }
      
      if (onSuccess) {
        onSuccess(result)
      }
      
      return result
    } catch (error) {
      if (showError) {
        console.error(`Erro em ${actionName}:`, error)
        alert(errorMsg)
      }
      
      if (onError) {
        onError(error)
      }
    } finally {
      component[loadingData] = false
    }
  }
}