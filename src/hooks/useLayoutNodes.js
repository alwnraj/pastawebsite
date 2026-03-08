import { useMemo } from 'react'
import dagre from 'dagre'

const QUESTION_WIDTH = 260
const QUESTION_HEIGHT = 136
const PASTA_WIDTH = 320
const PASTA_HEIGHT = 132
const OPEN_PASTA_HEIGHT = 264
const ROOT_BRANCH_DISTANCE = 340
const SUBTREE_NODE_SEPARATION = 72
const SUBTREE_RANK_SEPARATION = 180

function getNodeDimensions(node, openPastaIds) {
  const isPasta = node.type === 'pasta'
  const isDisplayedOpen = openPastaIds.has(node.id)

  return {
    isPasta,
    width: isPasta ? PASTA_WIDTH : QUESTION_WIDTH,
    height: isPasta
      ? isDisplayedOpen
        ? OPEN_PASTA_HEIGHT
        : PASTA_HEIGHT
      : QUESTION_HEIGHT,
  }
}

function rotatePoint(point, angleInRadians) {
  return {
    x: point.x * Math.cos(angleInRadians) - point.y * Math.sin(angleInRadians),
    y: point.x * Math.sin(angleInRadians) + point.y * Math.cos(angleInRadians),
  }
}

function collectVisibleSubtreeIds(nodeId, treeIndex, visibleNodeIdSet) {
  if (!visibleNodeIdSet.has(nodeId)) {
    return []
  }

  const subtreeIds = [nodeId]
  const childIds = treeIndex.childrenById.get(nodeId) ?? []

  childIds.forEach((childId) => {
    subtreeIds.push(...collectVisibleSubtreeIds(childId, treeIndex, visibleNodeIdSet))
  })

  return subtreeIds
}

function getBranchAngles(branchCount) {
  if (branchCount === 0) {
    return []
  }

  const step = (Math.PI * 2) / branchCount
  const startAngle = -Math.PI / 2

  return Array.from({ length: branchCount }, (_, index) => startAngle + step * index)
}

function getHandleIdFromVector(dx, dy) {
  if (Math.abs(dx) >= Math.abs(dy)) {
    return dx >= 0 ? 'right' : 'left'
  }

  return dy >= 0 ? 'bottom' : 'top'
}

function buildHighlightedEdgeIds(treeIndex, hoveredNodeId) {
  if (!hoveredNodeId) {
    return new Set()
  }

  const highlightedEdgeIds = new Set()
  let currentNodeId = hoveredNodeId

  while (currentNodeId) {
    const parentNodeId = treeIndex.parentById.get(currentNodeId)

    if (!parentNodeId) {
      break
    }

    highlightedEdgeIds.add(`${parentNodeId}-${currentNodeId}`)
    currentNodeId = parentNodeId
  }

  return highlightedEdgeIds
}

function layoutVisibleNodes({
  tree,
  treeIndex,
  visibleNodeIds,
  expandedQuestionIds,
  openPastaIds,
  activePastaId,
  closingPastaId,
  hoveredNodeId,
  onQuestionToggle,
  onPastaToggle,
}) {
  const visibleNodeIdSet = new Set(visibleNodeIds)
  const nodeMetaById = new Map()
  const centerPositionsById = new Map()
  const rootNode = tree

  visibleNodeIds.forEach((nodeId) => {
    const node = treeIndex.nodesById.get(nodeId)
    nodeMetaById.set(nodeId, getNodeDimensions(node, openPastaIds))
  })

  centerPositionsById.set(rootNode.id, { x: 0, y: 0 })

  const rootChildIds = (treeIndex.childrenById.get(rootNode.id) ?? []).filter((childId) =>
    visibleNodeIdSet.has(childId),
  )
  const branchAngles = getBranchAngles(rootChildIds.length)

  rootChildIds.forEach((childId, branchIndex) => {
    const subtreeIds = collectVisibleSubtreeIds(childId, treeIndex, visibleNodeIdSet)
    const graph = new dagre.graphlib.Graph()
    graph.setDefaultEdgeLabel(() => ({}))
    graph.setGraph({
      rankdir: 'LR',
      nodesep: SUBTREE_NODE_SEPARATION,
      ranksep: SUBTREE_RANK_SEPARATION,
      marginx: 0,
      marginy: 0,
    })

    subtreeIds.forEach((nodeId) => {
      const { width, height } = nodeMetaById.get(nodeId)
      graph.setNode(nodeId, { width, height })
    })

    subtreeIds.forEach((nodeId) => {
      const parentId = treeIndex.parentById.get(nodeId)

      if (parentId && visibleNodeIdSet.has(parentId) && parentId !== rootNode.id) {
        graph.setEdge(parentId, nodeId)
      }
    })

    dagre.layout(graph)

    const childRootPosition = graph.node(childId)
    const branchAngle = branchAngles[branchIndex]
    const branchAnchor = {
      x: Math.cos(branchAngle) * ROOT_BRANCH_DISTANCE,
      y: Math.sin(branchAngle) * ROOT_BRANCH_DISTANCE,
    }

    subtreeIds.forEach((nodeId) => {
      const graphPosition = graph.node(nodeId)
      const relativePosition = {
        x: graphPosition.x - childRootPosition.x,
        y: graphPosition.y - childRootPosition.y,
      }
      const rotatedPosition = rotatePoint(relativePosition, branchAngle)

      centerPositionsById.set(nodeId, {
        x: branchAnchor.x + rotatedPosition.x,
        y: branchAnchor.y + rotatedPosition.y,
      })
    })
  })

  const nodes = visibleNodeIds.map((nodeId) => {
    const node = treeIndex.nodesById.get(nodeId)
    const { isPasta, width, height } = nodeMetaById.get(nodeId)
    const position = centerPositionsById.get(nodeId) ?? { x: 0, y: 0 }
    const isActive = nodeId === activePastaId
    const isClosing = nodeId === closingPastaId
    const isDisplayedOpen = isActive || isClosing
    const children = node.children ?? []

    return {
      id: nodeId,
      type: isPasta ? 'pasta' : 'question',
      width,
      height,
      position: {
        x: position.x - width / 2,
        y: position.y - height / 2,
      },
      data: isPasta
        ? {
            label: node.label,
            pronunciation: node.pronunciation,
            icon: node.icon,
            fact: node.fact,
            isOpen: isDisplayedOpen,
            isClosing,
            isActive,
            isDisplayedOpen,
            onToggle: () => onPastaToggle(nodeId),
          }
        : {
            label: node.label,
            childCount: children.length,
            isExpanded: expandedQuestionIds.has(nodeId),
            isRoot: nodeId === rootNode.id,
            onToggle: () => onQuestionToggle(nodeId),
          },
      draggable: false,
      selectable: false,
      style: {
        width,
        height,
        zIndex: isActive ? 4 : isClosing ? 3 : 2,
      },
    }
  })

  const highlightedEdgeIds = buildHighlightedEdgeIds(treeIndex, hoveredNodeId)

  const edges = visibleNodeIds
    .filter((nodeId) => {
      const parentId = treeIndex.parentById.get(nodeId)
      return parentId && visibleNodeIdSet.has(parentId)
    })
    .map((nodeId) => {
      const parentId = treeIndex.parentById.get(nodeId)
      const parentCenter = centerPositionsById.get(parentId)
      const targetCenter = centerPositionsById.get(nodeId)
      const dx = targetCenter.x - parentCenter.x
      const dy = targetCenter.y - parentCenter.y
      const targetNode = treeIndex.nodesById.get(nodeId)
      const isEndpointEdge = targetNode.type === 'pasta'
      const isExplored = isEndpointEdge || expandedQuestionIds.has(nodeId)
      const isHighlighted = highlightedEdgeIds.has(`${parentId}-${nodeId}`)

      return {
        id: `${parentId}-${nodeId}`,
        source: parentId,
        target: nodeId,
        sourceHandle: getHandleIdFromVector(dx, dy),
        targetHandle: getHandleIdFromVector(-dx, -dy),
        type: 'smoothstep',
        animated: false,
        zIndex: isHighlighted ? 3 : 1,
        style: {
          stroke: isHighlighted
            ? 'rgba(82, 101, 67, 0.95)'
            : isExplored
              ? 'rgba(184, 92, 56, 0.92)'
              : 'rgba(184, 92, 56, 0.28)',
          strokeWidth: isHighlighted ? 4 : 2.6,
          strokeDasharray: isEndpointEdge
            ? undefined
            : isExplored
              ? '12 9'
              : '8 10',
          opacity: isHighlighted || isExplored ? 1 : 0.9,
        },
      }
    })

  const focusTarget = activePastaId
    ? (() => {
        const activeNode = nodes.find((node) => node.id === activePastaId)

        if (!activeNode) {
          return null
        }

        return {
          id: activeNode.id,
          x: activeNode.position.x + activeNode.width / 2,
          y: activeNode.position.y + activeNode.height / 2,
        }
      })()
    : null

  return {
    nodes,
    edges,
    structureKey: `${visibleNodeIds.join(',')}|${Array.from(expandedQuestionIds).sort().join(',')}`,
    focusTarget,
  }
}

export function useLayoutNodes({
  tree,
  treeIndex,
  visibleNodeIds,
  expandedQuestionIds,
  openPastaIds,
  activePastaId,
  closingPastaId,
  focusRequest,
  hoveredNodeId,
  onQuestionToggle,
  onPastaToggle,
}) {
  return useMemo(() => {
    const { nodes, edges, structureKey, focusTarget } = layoutVisibleNodes({
      tree,
      treeIndex,
      visibleNodeIds,
      expandedQuestionIds,
      openPastaIds,
      activePastaId,
      closingPastaId,
      hoveredNodeId,
      onQuestionToggle,
      onPastaToggle,
    })

    return {
      nodes,
      edges,
      structureKey,
      focusTarget,
      focusKey: focusRequest
        ? `${focusRequest.id}:${focusRequest.version}`
        : activePastaId ?? '',
    }
  }, [
    tree,
    treeIndex,
    visibleNodeIds,
    expandedQuestionIds,
    openPastaIds,
    activePastaId,
    closingPastaId,
    focusRequest,
    hoveredNodeId,
    onQuestionToggle,
    onPastaToggle,
  ])
}
