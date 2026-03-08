import dagre from 'dagre'

const QUESTION_WIDTH = 260
const QUESTION_HEIGHT = 136
const PASTA_WIDTH = 320
const PASTA_HEIGHT = 132
const OPEN_PASTA_HEIGHT = 260

function layoutVisibleNodes(tree, treeIndex, visibleNodeIds, expandedQuestionIds, openPastaIds) {
  const visibleNodeIdSet = new Set(visibleNodeIds)
  const graph = new dagre.graphlib.Graph()
  graph.setDefaultEdgeLabel(() => ({}))
  graph.setGraph({
    rankdir: 'LR',
    nodesep: 48,
    ranksep: 120,
    marginx: 40,
    marginy: 40,
  })

  visibleNodeIds.forEach((nodeId) => {
    const node = treeIndex.nodesById.get(nodeId)
    const isPasta = node.type === 'pasta'
    const height = isPasta
      ? openPastaIds.has(nodeId)
        ? OPEN_PASTA_HEIGHT
        : PASTA_HEIGHT
      : QUESTION_HEIGHT

    graph.setNode(nodeId, {
      width: isPasta ? PASTA_WIDTH : QUESTION_WIDTH,
      height,
    })
  })

  visibleNodeIds.forEach((nodeId) => {
    const parentId = treeIndex.parentById.get(nodeId)

    if (parentId && visibleNodeIdSet.has(parentId)) {
      graph.setEdge(parentId, nodeId)
    }
  })

  dagre.layout(graph)

  const nodes = visibleNodeIds.map((nodeId) => {
    const node = treeIndex.nodesById.get(nodeId)
    const position = graph.node(nodeId)
    const isPasta = node.type === 'pasta'
    const isOpen = openPastaIds.has(nodeId)
    const children = node.children ?? []
    const width = isPasta ? PASTA_WIDTH : QUESTION_WIDTH
    const height = isPasta ? (isOpen ? OPEN_PASTA_HEIGHT : PASTA_HEIGHT) : QUESTION_HEIGHT

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
            isOpen,
            onToggle: () => tree.togglePastaNode(nodeId),
          }
        : {
            label: node.label,
            childCount: children.length,
            isExpanded: expandedQuestionIds.has(nodeId),
            isRoot: nodeId === tree.root.id,
            onToggle: () => tree.toggleQuestionNode(nodeId),
          },
      draggable: false,
      selectable: false,
      style: {
        width,
        height,
        zIndex: 2,
      },
    }
  })

  const edges = visibleNodeIds
    .filter((nodeId) => {
      const parentId = treeIndex.parentById.get(nodeId)
      return parentId && visibleNodeIdSet.has(parentId)
    })
    .map((nodeId) => {
      const parentId = treeIndex.parentById.get(nodeId)

      return {
        id: `${parentId}-${nodeId}`,
        source: parentId,
        target: nodeId,
        type: 'smoothstep',
        animated: true,
        style: {
          stroke: 'rgba(82, 101, 67, 0.4)',
          strokeWidth: 2,
        },
      }
    })

  return { nodes, edges }
}

export function useLayoutNodes({
  tree,
  treeIndex,
  visibleNodeIds,
  expandedQuestionIds,
  openPastaIds,
  onQuestionToggle,
  onPastaToggle,
}) {
  const { nodes, edges } = layoutVisibleNodes(
    {
      root: tree,
      toggleQuestionNode: onQuestionToggle,
      togglePastaNode: onPastaToggle,
    },
    treeIndex,
    visibleNodeIds,
    expandedQuestionIds,
    openPastaIds,
  )

  return {
    nodes,
    edges,
    fitKey: `${visibleNodeIds.join(',')}|${Array.from(openPastaIds).join(',')}`,
  }
}
