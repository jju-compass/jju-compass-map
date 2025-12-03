/**
 * JJU Compass - Road Network Data
 * 전주대학교 주변 도로 네트워크 그래프
 *
 * 이 파일은 전주대 주변의 주요 도로와 교차점을 정의합니다.
 * A* 알고리즘을 위한 그래프 데이터 구조입니다.
 */

// 도로 네트워크 그래프 클래스
class RoadNetwork {
    constructor() {
        this.nodes = new Map();
        this.edges = new Map();
        this._initializeNetwork();
    }

    // 전주대 주변 도로 네트워크 초기화
    _initializeNetwork() {
        // 노드 정의 (교차점, 주요 지점)
        // 전주대학교 중심: 약 35.8144, 127.0925

        const nodeData = [
            // 전주대 캠퍼스 주변
            { id: 'n001', lat: 35.8144, lng: 127.0925, name: '전주대 정문' },
            { id: 'n002', lat: 35.8150, lng: 127.0930, name: '정문 교차로' },
            { id: 'n003', lat: 35.8160, lng: 127.0935, name: '북문 앞' },
            { id: 'n004', lat: 35.8140, lng: 127.0940, name: '동문 방향' },

            // 북쪽 상가 지역
            { id: 'n005', lat: 35.8170, lng: 127.0925, name: '북쪽 상가 입구' },
            { id: 'n006', lat: 35.8180, lng: 127.0930, name: '편의점 거리' },
            { id: 'n007', lat: 35.8190, lng: 127.0935, name: '식당가 교차로' },
            { id: 'n008', lat: 35.8175, lng: 127.0945, name: '카페 거리' },

            // 동쪽 지역
            { id: 'n009', lat: 35.8150, lng: 127.0950, name: '동쪽 대로' },
            { id: 'n010', lat: 35.8160, lng: 127.0955, name: '병원 앞' },
            { id: 'n011', lat: 35.8170, lng: 127.0960, name: '약국 거리' },
            { id: 'n012', lat: 35.8140, lng: 127.0965, name: '동쪽 끝 교차로' },

            // 남쪽 지역
            { id: 'n013', lat: 35.8120, lng: 127.0925, name: '남문 교차로' },
            { id: 'n014', lat: 35.8110, lng: 127.0930, name: '남쪽 상가' },
            { id: 'n015', lat: 35.8100, lng: 127.0940, name: '남쪽 대로' },
            { id: 'n016', lat: 35.8115, lng: 127.0945, name: '남동쪽 지역' },

            // 서쪽 지역
            { id: 'n017', lat: 35.8145, lng: 127.0905, name: '서문 교차로' },
            { id: 'n018', lat: 35.8155, lng: 127.0900, name: '서쪽 상가' },
            { id: 'n019', lat: 35.8165, lng: 127.0910, name: '서북쪽 지역' },
            { id: 'n020', lat: 35.8125, lng: 127.0915, name: '서남쪽 지역' },

            // 외곽 연결 지점
            { id: 'n021', lat: 35.8200, lng: 127.0940, name: '북쪽 외곽' },
            { id: 'n022', lat: 35.8180, lng: 127.0975, name: '동쪽 외곽' },
            { id: 'n023', lat: 35.8090, lng: 127.0950, name: '남쪽 외곽' },
            { id: 'n024', lat: 35.8135, lng: 127.0890, name: '서쪽 외곽' },

            // 추가 중간 노드들 (더 촘촘한 네트워크)
            { id: 'n025', lat: 35.8155, lng: 127.0920, name: '캠퍼스 중앙로' },
            { id: 'n026', lat: 35.8145, lng: 127.0915, name: '중앙 교차로 1' },
            { id: 'n027', lat: 35.8135, lng: 127.0930, name: '중앙 교차로 2' },
            { id: 'n028', lat: 35.8150, lng: 127.0940, name: '중앙 교차로 3' },
            { id: 'n029', lat: 35.8165, lng: 127.0925, name: '북쪽 중간 지점' },
            { id: 'n030', lat: 35.8155, lng: 127.0950, name: '동쪽 중간 지점' }
        ];

        // 노드 추가
        nodeData.forEach(node => {
            this.addNode(node.id, node.lat, node.lng, node.name);
        });

        // 엣지(도로 연결) 정의
        // [from, to, type] - type: 'main' (주요 도로), 'side' (골목), 'path' (보도)
        const edgeData = [
            // 정문 주변 연결
            ['n001', 'n002', 'main'],
            ['n002', 'n003', 'main'],
            ['n002', 'n025', 'main'],
            ['n001', 'n027', 'side'],
            ['n001', 'n004', 'side'],

            // 북쪽 상가 지역 연결
            ['n003', 'n005', 'main'],
            ['n005', 'n006', 'main'],
            ['n006', 'n007', 'main'],
            ['n007', 'n021', 'main'],
            ['n005', 'n029', 'side'],
            ['n006', 'n008', 'side'],
            ['n007', 'n008', 'path'],

            // 동쪽 지역 연결
            ['n004', 'n009', 'main'],
            ['n009', 'n010', 'main'],
            ['n010', 'n011', 'main'],
            ['n011', 'n022', 'main'],
            ['n009', 'n028', 'side'],
            ['n010', 'n030', 'side'],
            ['n004', 'n012', 'side'],
            ['n012', 'n009', 'path'],

            // 남쪽 지역 연결
            ['n001', 'n013', 'main'],
            ['n013', 'n014', 'main'],
            ['n014', 'n015', 'main'],
            ['n015', 'n023', 'main'],
            ['n013', 'n020', 'side'],
            ['n014', 'n016', 'side'],
            ['n015', 'n016', 'path'],

            // 서쪽 지역 연결
            ['n001', 'n017', 'main'],
            ['n017', 'n018', 'main'],
            ['n018', 'n019', 'main'],
            ['n019', 'n024', 'side'],
            ['n017', 'n026', 'side'],
            ['n018', 'n025', 'path'],

            // 중앙 교차 연결
            ['n025', 'n029', 'main'],
            ['n025', 'n028', 'side'],
            ['n026', 'n025', 'side'],
            ['n026', 'n027', 'side'],
            ['n027', 'n028', 'side'],
            ['n028', 'n030', 'side'],
            ['n028', 'n004', 'path'],

            // 외곽 순환 연결
            ['n021', 'n022', 'main'],
            ['n022', 'n023', 'main'],
            ['n023', 'n024', 'main'],
            ['n024', 'n018', 'side'],

            // 추가 크로스 연결 (다양한 경로 제공)
            ['n003', 'n030', 'path'],
            ['n005', 'n008', 'path'],
            ['n008', 'n011', 'side'],
            ['n016', 'n012', 'path'],
            ['n020', 'n017', 'path'],
            ['n029', 'n003', 'side'],
            ['n030', 'n009', 'path'],
            ['n013', 'n027', 'side'],
            ['n019', 'n029', 'side']
        ];

        // 엣지 추가 (양방향)
        edgeData.forEach(([from, to, type]) => {
            this.addEdge(from, to, type);
        });
    }

    // 노드 추가
    addNode(id, lat, lng, name = '') {
        this.nodes.set(id, {
            id,
            lat,
            lng,
            name,
            neighbors: []
        });
    }

    // 엣지 추가 (양방향)
    addEdge(fromId, toId, type = 'main') {
        const from = this.nodes.get(fromId);
        const to = this.nodes.get(toId);

        if (!from || !to) {
            console.warn(`[RoadNetwork] 노드를 찾을 수 없음: ${fromId} -> ${toId}`);
            return;
        }

        // 거리 계산 (Haversine)
        const distance = this._calculateDistance(from.lat, from.lng, to.lat, to.lng);

        // 도로 타입에 따른 가중치
        const weightMultiplier = {
            'main': 1.0,    // 주요 도로: 빠름
            'side': 1.2,    // 골목길: 약간 느림
            'path': 1.5     // 보도: 더 느림
        };

        const weight = distance * (weightMultiplier[type] || 1.0);

        // 양방향 엣지 추가
        from.neighbors.push({ nodeId: toId, distance, weight, type });
        to.neighbors.push({ nodeId: fromId, distance, weight, type });

        // 엣지 맵에 저장
        const edgeKey1 = `${fromId}_${toId}`;
        const edgeKey2 = `${toId}_${fromId}`;

        this.edges.set(edgeKey1, { from: fromId, to: toId, distance, weight, type });
        this.edges.set(edgeKey2, { from: toId, to: fromId, distance, weight, type });
    }

    // Haversine 거리 계산 (미터)
    _calculateDistance(lat1, lng1, lat2, lng2) {
        const R = 6371e3; // 지구 반지름 (미터)
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

    // 가장 가까운 노드 찾기
    findNearestNode(lat, lng) {
        let nearestNode = null;
        let minDistance = Infinity;

        this.nodes.forEach(node => {
            const distance = this._calculateDistance(lat, lng, node.lat, node.lng);
            if (distance < minDistance) {
                minDistance = distance;
                nearestNode = node;
            }
        });

        return { node: nearestNode, distance: minDistance };
    }

    // 노드 가져오기
    getNode(nodeId) {
        return this.nodes.get(nodeId);
    }

    // 모든 노드 가져오기
    getAllNodes() {
        return Array.from(this.nodes.values());
    }

    // 엣지 정보 가져오기
    getEdge(fromId, toId) {
        return this.edges.get(`${fromId}_${toId}`);
    }

    // 네트워크 통계
    getStats() {
        return {
            nodes: this.nodes.size,
            edges: this.edges.size / 2, // 양방향이므로 2로 나눔
            avgNeighbors: Array.from(this.nodes.values())
                .reduce((sum, node) => sum + node.neighbors.length, 0) / this.nodes.size
        };
    }
}

// 전역 인스턴스 생성
const roadNetwork = new RoadNetwork();

// 디버그 정보 출력
if (typeof window !== 'undefined' && window.JJU_DEBUG_ROUTE) {
    console.log('[RoadNetwork] 초기화 완료:', roadNetwork.getStats());
}
