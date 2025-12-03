/**
 * JJU Compass - A* Pathfinding Algorithm
 * A* 알고리즘을 사용한 최적 경로 탐색
 *
 * A* 알고리즘은 휴리스틱(heuristic)을 사용하여 효율적으로 최단 경로를 찾습니다.
 * f(n) = g(n) + h(n)
 * - g(n): 시작점부터 현재 노드까지의 실제 비용
 * - h(n): 현재 노드부터 목표까지의 예상 비용 (휴리스틱)
 * - f(n): 총 예상 비용
 */

class PathFinder {
    constructor(roadNetwork) {
        this.network = roadNetwork;
    }

    /**
     * A* 알고리즘으로 최적 경로 찾기
     * @param {Object} start - 시작 좌표 {lat, lng}
     * @param {Object} end - 목표 좌표 {lat, lng}
     * @returns {Object} - 경로 정보 {path, distance, nodeCount}
     */
    findPath(start, end) {
        const startTime = performance.now();

        // 1. 시작점과 끝점에 가장 가까운 노드 찾기
        const startResult = this.network.findNearestNode(start.lat, start.lng);
        const endResult = this.network.findNearestNode(end.lat, end.lng);

        if (!startResult.node || !endResult.node) {
            console.error('[PathFinder] 시작 또는 끝 노드를 찾을 수 없음');
            return null;
        }

        const startNode = startResult.node;
        const endNode = endResult.node;

        if (window.JJU_DEBUG_ROUTE) {
            console.log('[PathFinder] 시작 노드:', startNode.name, `(${startResult.distance.toFixed(1)}m 떨어짐)`);
            console.log('[PathFinder] 목표 노드:', endNode.name, `(${endResult.distance.toFixed(1)}m 떨어짐)`);
        }

        // 같은 노드인 경우
        if (startNode.id === endNode.id) {
            return {
                path: [start, end],
                distance: this._heuristic(start.lat, start.lng, end.lat, end.lng),
                nodeCount: 1,
                algorithm: 'direct'
            };
        }

        // 2. A* 알고리즘 실행
        const result = this._astar(startNode, endNode);

        if (!result) {
            console.warn('[PathFinder] 경로를 찾을 수 없음');
            return null;
        }

        // 3. 실제 좌표 경로 생성 (시작점 -> 노드들 -> 끝점)
        const fullPath = [
            start,
            ...result.nodePath.map(nodeId => {
                const node = this.network.getNode(nodeId);
                return { lat: node.lat, lng: node.lng };
            }),
            end
        ];

        // 4. 총 거리 계산 (실제 좌표 포함)
        let totalDistance = startResult.distance; // 시작점 -> 첫 노드
        totalDistance += result.distance; // 노드 간 거리
        totalDistance += endResult.distance; // 마지막 노드 -> 끝점

        const endTime = performance.now();

        if (window.JJU_DEBUG_ROUTE) {
            console.log('[PathFinder] 경로 탐색 완료:', {
                노드수: result.nodePath.length,
                거리: `${totalDistance.toFixed(1)}m`,
                탐색시간: `${(endTime - startTime).toFixed(2)}ms`,
                탐색노드: result.exploredNodes
            });
        }

        return {
            path: fullPath,
            distance: totalDistance,
            nodeCount: result.nodePath.length,
            exploredNodes: result.exploredNodes,
            algorithm: 'astar',
            computeTime: endTime - startTime
        };
    }

    /**
     * A* 알고리즘 핵심 구현
     * @private
     */
    _astar(startNode, endNode) {
        // 우선순위 큐 (최소 힙) - f값이 낮은 것부터 처리
        const openSet = new PriorityQueue();

        // 닫힌 집합 (이미 처리한 노드)
        const closedSet = new Set();

        // g-cost: 시작점부터 각 노드까지의 실제 비용
        const gScore = new Map();
        gScore.set(startNode.id, 0);

        // f-cost: g + h (총 예상 비용)
        const fScore = new Map();
        const startH = this._heuristic(
            startNode.lat, startNode.lng,
            endNode.lat, endNode.lng
        );
        fScore.set(startNode.id, startH);

        // 경로 추적을 위한 부모 맵
        const cameFrom = new Map();

        // 시작 노드를 열린 집합에 추가
        openSet.enqueue(startNode.id, startH);

        let exploredNodes = 0;

        // 메인 루프
        while (!openSet.isEmpty()) {
            // f값이 가장 낮은 노드 선택
            const current = openSet.dequeue();
            exploredNodes++;

            // 목표 도달
            if (current === endNode.id) {
                return {
                    nodePath: this._reconstructPath(cameFrom, current),
                    distance: gScore.get(current),
                    exploredNodes
                };
            }

            closedSet.add(current);

            // 이웃 노드 탐색
            const currentNode = this.network.getNode(current);
            for (const neighbor of currentNode.neighbors) {
                const neighborId = neighbor.nodeId;

                // 이미 처리한 노드는 스킵
                if (closedSet.has(neighborId)) {
                    continue;
                }

                // 임시 g-cost 계산
                const tentativeG = gScore.get(current) + neighbor.weight;

                // 더 나은 경로를 찾은 경우 업데이트
                if (!gScore.has(neighborId) || tentativeG < gScore.get(neighborId)) {
                    // 경로 기록
                    cameFrom.set(neighborId, current);
                    gScore.set(neighborId, tentativeG);

                    // h-cost 계산 (휴리스틱: 직선 거리)
                    const neighborNode = this.network.getNode(neighborId);
                    const h = this._heuristic(
                        neighborNode.lat, neighborNode.lng,
                        endNode.lat, endNode.lng
                    );

                    // f-cost 계산
                    const f = tentativeG + h;
                    fScore.set(neighborId, f);

                    // 열린 집합에 추가
                    openSet.enqueue(neighborId, f);
                }
            }
        }

        // 경로를 찾지 못함
        return null;
    }

    /**
     * 경로 재구성 (역추적)
     * @private
     */
    _reconstructPath(cameFrom, current) {
        const path = [current];

        while (cameFrom.has(current)) {
            current = cameFrom.get(current);
            path.unshift(current);
        }

        return path;
    }

    /**
     * 휴리스틱 함수: 두 지점 간 직선 거리 (Haversine)
     * @private
     */
    _heuristic(lat1, lng1, lat2, lng2) {
        const R = 6371e3;
        const φ1 = lat1 * Math.PI / 180;
        const φ2 = lat2 * Math.PI / 180;
        const Δφ = (lat2 - lat1) * Math.PI / 180;
        const Δλ = (lng2 - lng1) * Math.PI / 180;

        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
                  Math.cos(φ1) * Math.cos(φ2) *
                  Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c;
    }

    /**
     * 경로를 더 부드럽게 만들기 (중간 보간점 추가)
     * @param {Array} path - 노드 경로
     * @param {number} stepMeters - 보간 간격 (미터)
     * @returns {Array} - 보간된 경로
     */
    smoothPath(path, stepMeters = 5) {
        if (!path || path.length < 2) return path;

        const smoothed = [];

        for (let i = 0; i < path.length - 1; i++) {
            const start = path[i];
            const end = path[i + 1];

            // 현재 구간의 거리
            const distance = this._heuristic(start.lat, start.lng, end.lat, end.lng);

            // 필요한 중간 점 개수
            const steps = Math.ceil(distance / stepMeters);

            // 보간
            for (let j = 0; j < steps; j++) {
                const t = j / steps;
                smoothed.push({
                    lat: start.lat + (end.lat - start.lat) * t,
                    lng: start.lng + (end.lng - start.lng) * t
                });
            }
        }

        // 마지막 점 추가
        smoothed.push(path[path.length - 1]);

        return smoothed;
    }

    /**
     * 경로 정보 가져오기 (디버깅용)
     */
    getPathInfo(path) {
        if (!path || path.length < 2) return null;

        let totalDistance = 0;
        const segments = [];

        for (let i = 0; i < path.length - 1; i++) {
            const distance = this._heuristic(
                path[i].lat, path[i].lng,
                path[i + 1].lat, path[i + 1].lng
            );
            totalDistance += distance;
            segments.push({
                from: i,
                to: i + 1,
                distance: distance.toFixed(1)
            });
        }

        return {
            totalDistance: totalDistance.toFixed(1),
            segments: segments.length,
            avgSegment: (totalDistance / segments.length).toFixed(1)
        };
    }
}

/**
 * 우선순위 큐 (최소 힙)
 * A* 알고리즘의 열린 집합 관리용
 */
class PriorityQueue {
    constructor() {
        this.items = [];
    }

    enqueue(item, priority) {
        const node = { item, priority };

        // 적절한 위치에 삽입 (우선순위 낮은 것부터)
        let added = false;
        for (let i = 0; i < this.items.length; i++) {
            if (priority < this.items[i].priority) {
                this.items.splice(i, 0, node);
                added = true;
                break;
            }
        }

        if (!added) {
            this.items.push(node);
        }
    }

    dequeue() {
        if (this.isEmpty()) return null;
        return this.items.shift().item;
    }

    isEmpty() {
        return this.items.length === 0;
    }

    size() {
        return this.items.length;
    }
}

// 전역 인스턴스 생성
const pathFinder = new PathFinder(roadNetwork);

// 디버그 정보
if (typeof window !== 'undefined' && window.JJU_DEBUG_ROUTE) {
    console.log('[PathFinder] A* 알고리즘 초기화 완료');
}
