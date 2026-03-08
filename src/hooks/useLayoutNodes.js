import { useMemo } from 'react'
import dagre from 'dagre'

const MIN_QUESTION_WIDTH = 160
const MAX_QUESTION_WIDTH = 320
const QUESTION_BASE_HEIGHT = 136
const QUESTION_LINE_HEIGHT = 24
const PASTA_WIDTH = 320
const PASTA_HEIGHT = 132
const OPEN_PASTA_HEIGHT = 264
const ROOT_BRANCH_DISTANCE = 360
const ROOT_BRANCH_EXTRA_DISTANCE = 110
const MIN_ROOT_ANCHOR_GAP = MAX_QUESTION_WIDTH + 96
const SUBTREE_NODE_SEPARATION = 92
const SUBTREE_RANK_SEPARATION = 220
const ENDPOINT_NODE_SEPARATION = 132
const LONG_THIN_NODE_SEPARATION = 156
const LONG_THIN_RANK_SEPARATION = 244
const LONG_THIN_LEAF_DEPTH_STEP = 72
const MAX_BALANCED_VERTICAL_REACH = 980
const UNEXPLORED_EDGE_STROKE = 'rgba(196, 168, 130, 0.4)'
const EXPLORED_EDGE_STROKE = 'rgba(139, 99, 64, 0.8)'
const ENDPOINT_EDGE_STROKE = 'rgba(139, 99, 64, 0.9)'
const HIGHLIGHTED_EDGE_STROKE = 'rgba(139, 99, 64, 1)'
const CONNECTOR_STROKE_WIDTH = 1.5
const CONNECTOR_DASH_PATTERN = '7 6'

const ROOT_BRANCH_ANGLE_HINTS = new Map([
  ['long-thin', -112.5],
  ['long-flat', -67.5],
  ['short-tubular', -22.5],
  ['short-twisted-shaped', 22.5],
  ['tiny-miniature', 67.5],
  ['stuffed', 102],
  ['hand-shaped', 158],
  ['dumpling-irregular', 214],
])

const ROOT_BRANCH_DISTANCE_OFFSETS = new Map([
  ['long-thin', 52],
  ['tiny-miniature', 20],
  ['stuffed', 12],
  ['hand-shaped', 8],
])

const BRANCH_LAYOUT_OVERRIDES = new Map([
  [
    'tiny-miniature',
    {
      rankSeparationMultiplier: 0.9,
      lateralSpreadMultiplier: 1.08,
    },
  ],
  [
    'stuffed',
    {
      rankSeparationMultiplier: 0.72,
      nodeSeparationMultiplier: 1.2,
      depthScale: 0.76,
      lateralSpreadMultiplier: 1.34,
    },
  ],
  [
    'hand-shaped',
    {
      rankSeparationMultiplier: 0.8,
      nodeSeparationMultiplier: 1.16,
      depthScale: 0.82,
      lateralSpreadMultiplier: 1.22,
    },
  ],
  [
    'dumpling-irregular',
    {
      rankSeparationMultiplier: 0.86,
      lateralSpreadMultiplier: 1.08,
    },
  ],
])

function clamp(value, minimum, maximum) {
  return Math.min(Math.max(value, minimum), maximum)
}

function estimateWrappedLineCount(label, width) {
  const words = label.trim().split(/\s+/).filter(Boolean)

  if (words.length === 0) {
    return 1
  }

  const availableCharactersPerLine = Math.max(10, Math.floor((width - 56) / 9))
  let lineCount = 1
  let currentLineLength = 0

  words.forEach((word) => {
    const nextLength = currentLineLength === 0
      ? word.length
      : currentLineLength + word.length + 1

    if (nextLength > availableCharactersPerLine) {
      lineCount += 1
      currentLineLength = word.length
      return
    }

    currentLineLength = nextLength
  })

  return lineCount
}

function getQuestionDimensions(label) {
  const words = label.trim().split(/\s+/).filter(Boolean)
  const longestWordLength = words.reduce(
    (maximumLength, word) => Math.max(maximumLength, word.length),
    0,
  )
  const labelLength = label.length
  const estimatedWidth = clamp(
    Math.max(
      MIN_QUESTION_WIDTH,
      longestWordLength * 11 + 84,
      Math.min(MAX_QUESTION_WIDTH, labelLength * 7.5 + 64),
    ),
    MIN_QUESTION_WIDTH,
    MAX_QUESTION_WIDTH,
  )
  const lineCount = estimateWrappedLineCount(label, estimatedWidth)

  return {
    width: estimatedWidth,
    height: QUESTION_BASE_HEIGHT + Math.max(0, lineCount - 2) * QUESTION_LINE_HEIGHT,
  }
}

function getChildNodeSeparation(nodeId, treeIndex) {
  const childIds = treeIndex.childrenById.get(nodeId) ?? []

  if (childIds.length === 0) {
    return SUBTREE_NODE_SEPARATION
  }

  const allChildrenAreEndpoints = childIds.every((childId) => {
    const childNode = treeIndex.nodesById.get(childId)
    return childNode?.type === 'pasta'
  })

  return allChildrenAreEndpoints ? ENDPOINT_NODE_SEPARATION : SUBTREE_NODE_SEPARATION
}

function getLongThinLeafDepthOffset(nodeId, treeIndex, visibleNodeIdSet) {
  const parentId = treeIndex.parentById.get(nodeId)

  if (!parentId) {
    return 0
  }

  const siblingLeafIds = (treeIndex.childrenById.get(parentId) ?? []).filter((childId) => {
    if (!visibleNodeIdSet.has(childId)) {
      return false
    }

    const childNode = treeIndex.nodesById.get(childId)
    return childNode?.type === 'pasta'
  })

  if (siblingLeafIds.length <= 1) {
    return 0
  }

  const siblingIndex = siblingLeafIds.indexOf(nodeId)

  return siblingIndex < 0 ? 0 : (siblingIndex + 1) * LONG_THIN_LEAF_DEPTH_STEP
}

function getBranchLayoutOverride(branchId) {
  return BRANCH_LAYOUT_OVERRIDES.get(branchId) ?? {}
}

function getNodeDimensions(node, openPastaIds) {
  const isPasta = node.type === 'pasta'
  const isDisplayedOpen = openPastaIds.has(node.id)
  const questionDimensions = isPasta
    ? null
    : getQuestionDimensions(node.label)

  return {
    isPasta,
    width: isPasta ? PASTA_WIDTH : questionDimensions.width,
    height: isPasta
      ? isDisplayedOpen
        ? OPEN_PASTA_HEIGHT
        : PASTA_HEIGHT
      : questionDimensions.height,
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

function getRootBranchAngles(rootChildIds) {
  const fallbackAngles = getBranchAngles(rootChildIds.length)

  return rootChildIds.map((childId, index) => {
    const hintedAngle = ROOT_BRANCH_ANGLE_HINTS.get(childId)
    return hintedAngle === undefined
      ? fallbackAngles[index]
      : (hintedAngle * Math.PI) / 180
  })
}

function getRootBranchDistance(branchCount) {
  if (branchCount <= 1) {
    return ROOT_BRANCH_DISTANCE
  }

  const minimumDistanceForAnchorGap =
    MIN_ROOT_ANCHOR_GAP / (2 * Math.sin(Math.PI / branchCount))

  return Math.max(
    ROOT_BRANCH_DISTANCE + Math.max(0, branchCount - 4) * ROOT_BRANCH_EXTRA_DISTANCE,
    minimumDistanceForAnchorGap,
  )
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

function getNodeBounds(node) {
  return {
    left: node.position.x,
    right: node.position.x + node.width,
    top: node.position.y,
    bottom: node.position.y + node.height,
  }
}

function getBoundsCenter(bounds) {
  return {
    x: (bounds.left + bounds.right) / 2,
    y: (bounds.top + bounds.bottom) / 2,
  }
}

function getViewportBounds(bounds) {
  return {
    x: bounds.left,
    y: bounds.top,
    width: bounds.right - bounds.left,
    height: bounds.bottom - bounds.top,
  }
}

function clampLowerReach(position, branchAngle) {
  const angleMagnitude = Math.abs(Math.sin(branchAngle))

  if (angleMagnitude < 0.72 || position.y <= MAX_BALANCED_VERTICAL_REACH) {
    return position
  }

  const overflow = position.y - MAX_BALANCED_VERTICAL_REACH
  const direction = Math.cos(branchAngle) >= 0 ? 1 : -1

  return {
    x: position.x + overflow * 0.58 * direction,
    y: MAX_BALANCED_VERTICAL_REACH,
  }
}

function mergeNodeBounds(nodes) {
  if (nodes.length === 0) {
    return null
  }

  return nodes.reduce((bounds, node) => {
    const nodeBounds = getNodeBounds(node)

    return {
      left: Math.min(bounds.left, nodeBounds.left),
      right: Math.max(bounds.right, nodeBounds.right),
      top: Math.min(bounds.top, nodeBounds.top),
      bottom: Math.max(bounds.bottom, nodeBounds.bottom),
    }
  }, getNodeBounds(nodes[0]))
}

function getLayoutBounds(nodeIds, centerPositionsById, nodeMetaById) {
  if (nodeIds.length === 0) {
    return null
  }

  return nodeIds.reduce((bounds, nodeId) => {
    const position = centerPositionsById.get(nodeId)
    const dimensions = nodeMetaById.get(nodeId)

    if (!position || !dimensions) {
      return bounds
    }

    const nodeBounds = {
      left: position.x - dimensions.width / 2,
      right: position.x + dimensions.width / 2,
      top: position.y - dimensions.height / 2,
      bottom: position.y + dimensions.height / 2,
    }

    if (!bounds) {
      return nodeBounds
    }

    return {
      left: Math.min(bounds.left, nodeBounds.left),
      right: Math.max(bounds.right, nodeBounds.right),
      top: Math.min(bounds.top, nodeBounds.top),
      bottom: Math.max(bounds.bottom, nodeBounds.bottom),
    }
  }, null)
}

function getFocusTarget({ focusRequest, activePastaId, nodes, treeIndex, visibleNodeIdSet }) {
  const targetId = focusRequest?.id ?? activePastaId

  if (!targetId) {
    return null
  }

  const targetNode = nodes.find((node) => node.id === targetId)

  if (!targetNode) {
    return null
  }

  if (focusRequest?.type === 'branch') {
    const childNodes = (treeIndex.childrenById.get(targetId) ?? [])
      .filter((childId) => visibleNodeIdSet.has(childId))
      .map((childId) => nodes.find((node) => node.id === childId))
      .filter(Boolean)
    const focusBounds = mergeNodeBounds([targetNode, ...childNodes])

    if (focusBounds) {
      return {
        id: targetId,
        ...getBoundsCenter(focusBounds),
        bounds: getViewportBounds(focusBounds),
        type: 'branch',
      }
    }
  }

  const targetBounds = getNodeBounds(targetNode)

  return {
    id: targetId,
    ...getBoundsCenter(targetBounds),
    type: focusRequest?.type ?? 'pasta',
  }
}

function layoutVisibleNodes({
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
  const branchAngles = getRootBranchAngles(rootChildIds)
  const rootBranchDistance = getRootBranchDistance(rootChildIds.length)

  rootChildIds.forEach((childId, branchIndex) => {
    const subtreeIds = collectVisibleSubtreeIds(childId, treeIndex, visibleNodeIdSet)
    const branchLayoutOverride = getBranchLayoutOverride(childId)
    const branchNodeSeparation =
      childId === 'long-thin'
        ? LONG_THIN_NODE_SEPARATION
        : subtreeIds.reduce((maximumSeparation, nodeId) => {
            return Math.max(maximumSeparation, getChildNodeSeparation(nodeId, treeIndex))
          }, SUBTREE_NODE_SEPARATION)
    const effectiveNodeSeparation = branchNodeSeparation *
      (branchLayoutOverride.nodeSeparationMultiplier ?? 1)
    const effectiveRankSeparation =
      (childId === 'long-thin' ? LONG_THIN_RANK_SEPARATION : SUBTREE_RANK_SEPARATION) *
      (branchLayoutOverride.rankSeparationMultiplier ?? 1)
    const graph = new dagre.graphlib.Graph()
    graph.setDefaultEdgeLabel(() => ({}))
    graph.setGraph({
      rankdir: 'LR',
      nodesep: effectiveNodeSeparation,
      ranksep: effectiveRankSeparation,
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
      x:
        Math.cos(branchAngle) *
        (rootBranchDistance + (ROOT_BRANCH_DISTANCE_OFFSETS.get(childId) ?? 0)),
      y:
        Math.sin(branchAngle) *
        (rootBranchDistance + (ROOT_BRANCH_DISTANCE_OFFSETS.get(childId) ?? 0)),
    }

    subtreeIds.forEach((nodeId) => {
      const graphPosition = graph.node(nodeId)
      const relativePosition = {
        x: (graphPosition.x - childRootPosition.x) * (branchLayoutOverride.depthScale ?? 1),
        y:
          (graphPosition.y - childRootPosition.y) *
          (branchLayoutOverride.lateralSpreadMultiplier ?? 1),
      }
      if (childId === 'long-thin' && treeIndex.nodesById.get(nodeId)?.type === 'pasta') {
        relativePosition.x += getLongThinLeafDepthOffset(nodeId, treeIndex, visibleNodeIdSet)
      }
      const rotatedPosition = clampLowerReach(
        rotatePoint(relativePosition, branchAngle),
        branchAngle,
      )

      centerPositionsById.set(nodeId, {
        x: branchAnchor.x + rotatedPosition.x,
        y: branchAnchor.y + rotatedPosition.y,
      })
    })
  })

  const nonRootVisibleNodeIds = visibleNodeIds.filter((nodeId) => nodeId !== rootNode.id)
  const nonRootBounds = getLayoutBounds(nonRootVisibleNodeIds, centerPositionsById, nodeMetaById)

  if (nonRootBounds) {
    const balanceOffset = getBoundsCenter(nonRootBounds)

    nonRootVisibleNodeIds.forEach((nodeId) => {
      const position = centerPositionsById.get(nodeId)

      if (!position) {
        return
      }

      centerPositionsById.set(nodeId, {
        x: position.x - balanceOffset.x,
        y: position.y - balanceOffset.y,
      })
    })
  }

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
            width,
            height,
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
            ? HIGHLIGHTED_EDGE_STROKE
            : isEndpointEdge
              ? ENDPOINT_EDGE_STROKE
              : isExplored
                ? EXPLORED_EDGE_STROKE
                : UNEXPLORED_EDGE_STROKE,
          strokeWidth: CONNECTOR_STROKE_WIDTH,
          strokeDasharray: isEndpointEdge
            ? undefined
            : CONNECTOR_DASH_PATTERN,
          opacity: isHighlighted
            ? 1
            : isEndpointEdge
              ? 0.9
              : isExplored
                ? 0.8
                : 0.4,
        },
      }
    })

  const focusTarget = getFocusTarget({
    focusRequest,
    activePastaId,
    nodes,
    treeIndex,
    visibleNodeIdSet,
  })

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
      focusRequest,
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
