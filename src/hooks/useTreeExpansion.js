import { useState } from 'react'

function createTreeIndex(tree) {
  const nodesById = new Map()
  const parentById = new Map()
  const childrenById = new Map()
  const descendantIdsById = new Map()
  let totalPastas = 0

  function visit(node, parentId = null) {
    nodesById.set(node.id, node)
    parentById.set(node.id, parentId)

    const children = node.children ?? []
    childrenById.set(
      node.id,
      children.map((child) => child.id),
    )

    if (node.type === 'pasta') {
      totalPastas += 1
    }

    const descendantIds = []

    children.forEach((child) => {
      visit(child, node.id)
      descendantIds.push(child.id)
      const childDescendants = descendantIdsById.get(child.id) ?? []
      descendantIds.push(...childDescendants)
    })

    descendantIdsById.set(node.id, descendantIds)
  }

  visit(tree)

  return {
    nodesById,
    parentById,
    childrenById,
    descendantIdsById,
    totalPastas,
  }
}

function collectVisibleNodeIds(tree, expandedQuestionIds) {
  const visible = []

  function visit(node) {
    visible.push(node.id)

    if (!expandedQuestionIds.has(node.id)) {
      return
    }

    ;(node.children ?? []).forEach((child) => {
      visit(child)
    })
  }

  visit(tree)
  return visible
}

export function useTreeExpansion(tree) {
  const treeIndex = createTreeIndex(tree)
  const [expandedQuestionIds, setExpandedQuestionIds] = useState(() => new Set())
  const [openPastaIds, setOpenPastaIds] = useState(() => new Set())

  function toggleQuestionNode(nodeId) {
    const descendantIds = treeIndex.descendantIdsById.get(nodeId) ?? []
    setExpandedQuestionIds((current) => {
      const next = new Set(current)

      if (next.has(nodeId)) {
        next.delete(nodeId)
        descendantIds.forEach((descendantId) => next.delete(descendantId))
      } else {
        next.add(nodeId)
      }

      return next
    })

    setOpenPastaIds((current) => {
      if (!expandedQuestionIds.has(nodeId)) {
        return current
      }

      const next = new Set(current)
      descendantIds.forEach((descendantId) => next.delete(descendantId))
      return next
    })
  }

  function togglePastaNode(nodeId) {
    setOpenPastaIds((current) => {
      const next = new Set(current)

      if (next.has(nodeId)) {
        next.delete(nodeId)
      } else {
        next.add(nodeId)
      }

      return next
    })
  }

  function resetTree() {
    setExpandedQuestionIds(new Set())
    setOpenPastaIds(new Set())
  }

  return {
    treeIndex,
    visibleNodeIds: collectVisibleNodeIds(tree, expandedQuestionIds),
    expandedQuestionIds,
    openPastaIds,
    totalPastas: treeIndex.totalPastas,
    toggleQuestionNode,
    togglePastaNode,
    resetTree,
  }
}
