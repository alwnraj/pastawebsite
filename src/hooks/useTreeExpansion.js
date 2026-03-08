import { useEffect, useMemo, useRef, useState } from 'react'

const CARD_CLOSE_DURATION_MS = 180

function createTreeIndex(tree) {
  const nodesById = new Map()
  const parentById = new Map()
  const childrenById = new Map()
  const descendantIdsById = new Map()
  const depthById = new Map()
  let totalPastas = 0

  function visit(node, parentId = null, depth = 0) {
    nodesById.set(node.id, node)
    parentById.set(node.id, parentId)
    depthById.set(node.id, depth)

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
      visit(child, node.id, depth + 1)
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
    depthById,
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
  const treeIndex = useMemo(() => createTreeIndex(tree), [tree])
  const [expandedQuestionIds, setExpandedQuestionIds] = useState(() => new Set())
  const [activePastaId, setActivePastaId] = useState(null)
  const [closingPastaId, setClosingPastaId] = useState(null)
  const [focusRequest, setFocusRequest] = useState(null)
  const transitionTimerRef = useRef(null)
  const pendingPastaIdRef = useRef(null)
  const activePastaIdRef = useRef(null)
  const closingPastaIdRef = useRef(null)

  useEffect(() => {
    activePastaIdRef.current = activePastaId
  }, [activePastaId])

  useEffect(() => {
    closingPastaIdRef.current = closingPastaId
  }, [closingPastaId])

  useEffect(() => {
    return () => {
      if (transitionTimerRef.current) {
        window.clearTimeout(transitionTimerRef.current)
      }
    }
  }, [])

  function clearTransition() {
    if (transitionTimerRef.current) {
      window.clearTimeout(transitionTimerRef.current)
      transitionTimerRef.current = null
    }

    pendingPastaIdRef.current = null
  }

  function requestFocus(nodeId) {
    setFocusRequest((current) => ({
      id: nodeId,
      version: (current?.version ?? 0) + 1,
    }))
  }

  function closeDisplayedPasta(nodeId, nextPastaId = null) {
    if (!nodeId) {
      if (nextPastaId) {
        setActivePastaId(nextPastaId)
        requestFocus(nextPastaId)
      }

      return
    }

    clearTransition()
    pendingPastaIdRef.current = nextPastaId
    setActivePastaId(null)
    setClosingPastaId(nodeId)

    transitionTimerRef.current = window.setTimeout(() => {
      setClosingPastaId((current) => (current === nodeId ? null : current))
      transitionTimerRef.current = null
      const pendingPastaId = pendingPastaIdRef.current
      pendingPastaIdRef.current = null

      if (pendingPastaId) {
        setActivePastaId(pendingPastaId)
        requestFocus(pendingPastaId)
      }
    }, CARD_CLOSE_DURATION_MS)
  }

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

    if (expandedQuestionIds.has(nodeId)) {
      const visiblePastaId = activePastaIdRef.current ?? closingPastaIdRef.current

      if (visiblePastaId && descendantIds.includes(visiblePastaId)) {
        clearTransition()
        setActivePastaId(null)
        setClosingPastaId(null)
      }
    }
  }

  function togglePastaNode(nodeId) {
    const displayedPastaId = activePastaIdRef.current ?? closingPastaIdRef.current

    if (displayedPastaId === nodeId) {
      closeDisplayedPasta(nodeId)
      return
    }

    if (displayedPastaId) {
      closeDisplayedPasta(displayedPastaId, nodeId)
      return
    }

    clearTransition()
    setClosingPastaId(null)
    setActivePastaId(nodeId)
    requestFocus(nodeId)
  }

  function resetTree() {
    clearTransition()
    setExpandedQuestionIds(new Set())
    setActivePastaId(null)
    setClosingPastaId(null)
    setFocusRequest(null)
  }

  const openPastaIds = new Set(
    [activePastaId, closingPastaId].filter(Boolean),
  )
  const visibleNodeIds = useMemo(
    () => collectVisibleNodeIds(tree, expandedQuestionIds),
    [tree, expandedQuestionIds],
  )

  return {
    treeIndex,
    visibleNodeIds,
    expandedQuestionIds,
    openPastaIds,
    activePastaId,
    closingPastaId,
    focusRequest,
    totalPastas: treeIndex.totalPastas,
    toggleQuestionNode,
    togglePastaNode,
    resetTree,
  }
}
