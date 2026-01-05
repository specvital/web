"use client";

import { useCallback, useRef, useState } from "react";

type TreeNode = {
  children?: TreeNode[];
  id: string;
  isExpanded?: boolean;
  level: number;
};

type UseTreeNavigationProps<T extends TreeNode> = {
  getChildren: (node: T) => T[];
  isExpanded: (nodeId: string) => boolean;
  nodes: T[];
  onToggle: (nodeId: string) => void;
};

export const useTreeNavigation = <T extends TreeNode>({
  getChildren,
  isExpanded,
  nodes,
  onToggle,
}: UseTreeNavigationProps<T>) => {
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const nodeRefs = useRef<Map<string, HTMLElement>>(new Map());

  const getVisibleNodes = useCallback((): T[] => {
    const visible: T[] = [];

    const traverse = (items: T[]) => {
      for (const item of items) {
        visible.push(item);
        if (isExpanded(item.id)) {
          const children = getChildren(item);
          if (children.length > 0) {
            traverse(children);
          }
        }
      }
    };

    traverse(nodes);
    return visible;
  }, [nodes, isExpanded, getChildren]);

  const findParent = useCallback(
    (nodeId: string, items: T[], parent: T | null = null): T | null => {
      for (const item of items) {
        if (item.id === nodeId) {
          return parent;
        }
        const children = getChildren(item);
        if (children.length > 0) {
          const found = findParent(nodeId, children, item);
          if (found !== null) {
            return found;
          }
        }
      }
      return null;
    },
    [getChildren]
  );

  const focusNode = useCallback((nodeId: string) => {
    setFocusedId(nodeId);
    const element = nodeRefs.current.get(nodeId);
    if (element) {
      element.focus();
    }
  }, []);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      const visibleNodes = getVisibleNodes();

      if (visibleNodes.length === 0) {
        return;
      }

      const currentIndex = visibleNodes.findIndex((n) => n.id === focusedId);
      const currentNode = currentIndex >= 0 ? visibleNodes[currentIndex] : null;

      switch (event.key) {
        case "ArrowDown": {
          event.preventDefault();
          if (currentIndex < visibleNodes.length - 1) {
            const nextNode = visibleNodes[currentIndex + 1];
            if (nextNode) {
              focusNode(nextNode.id);
            }
          } else if (currentIndex === -1 && visibleNodes.length > 0) {
            const firstNode = visibleNodes[0];
            if (firstNode) {
              focusNode(firstNode.id);
            }
          }
          break;
        }

        case "ArrowUp": {
          event.preventDefault();
          if (currentIndex > 0) {
            const prevNode = visibleNodes[currentIndex - 1];
            if (prevNode) {
              focusNode(prevNode.id);
            }
          }
          break;
        }

        case "ArrowRight": {
          event.preventDefault();
          if (!currentNode) {
            break;
          }

          const children = getChildren(currentNode);
          if (children.length > 0) {
            if (!isExpanded(currentNode.id)) {
              onToggle(currentNode.id);
            } else {
              const firstChild = children[0];
              if (firstChild) {
                focusNode(firstChild.id);
              }
            }
          }
          break;
        }

        case "ArrowLeft": {
          event.preventDefault();
          if (!currentNode) {
            break;
          }

          const children = getChildren(currentNode);
          if (isExpanded(currentNode.id) && children.length > 0) {
            onToggle(currentNode.id);
          } else {
            const parent = findParent(currentNode.id, nodes);
            if (parent) {
              focusNode(parent.id);
            }
          }
          break;
        }

        case "Home": {
          event.preventDefault();
          const firstNode = visibleNodes[0];
          if (firstNode) {
            focusNode(firstNode.id);
          }
          break;
        }

        case "End": {
          event.preventDefault();
          const lastNode = visibleNodes[visibleNodes.length - 1];
          if (lastNode) {
            focusNode(lastNode.id);
          }
          break;
        }

        case "Enter":
        case " ": {
          event.preventDefault();
          if (focusedId) {
            onToggle(focusedId);
          }
          break;
        }
      }
    },
    [focusedId, getVisibleNodes, getChildren, isExpanded, onToggle, findParent, nodes, focusNode]
  );

  const registerNode = useCallback((nodeId: string, element: HTMLElement | null) => {
    if (element) {
      nodeRefs.current.set(nodeId, element);
    } else {
      nodeRefs.current.delete(nodeId);
    }
  }, []);

  const getTabIndex = useCallback(
    (nodeId: string): 0 | -1 => {
      if (focusedId === null) {
        return nodeId === nodes[0]?.id ? 0 : -1;
      }
      return focusedId === nodeId ? 0 : -1;
    },
    [focusedId, nodes]
  );

  return {
    focusedId,
    getTabIndex,
    handleKeyDown,
    registerNode,
    setFocusedId,
  };
};
