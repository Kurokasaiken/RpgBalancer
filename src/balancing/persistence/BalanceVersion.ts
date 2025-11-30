/**
 * Balance Version Management
 * Handles semantic versioning for configuration snapshots.
 */

export class BalanceVersion {
    static readonly CURRENT_VERSION = '1.0.0';

    /**
     * Compares two semantic versions.
     * Returns:
     * -1 if v1 < v2
     *  0 if v1 == v2
     *  1 if v1 > v2
     */
    static compare(v1: string, v2: string): number {
        const p1 = v1.split('.').map(Number);
        const p2 = v2.split('.').map(Number);

        for (let i = 0; i < 3; i++) {
            const n1 = p1[i] || 0;
            const n2 = p2[i] || 0;
            if (n1 > n2) return 1;
            if (n1 < n2) return -1;
        }
        return 0;
    }

    /**
     * Checks if a version is compatible (major version matches).
     */
    static isCompatible(v1: string, v2: string): boolean {
        const major1 = v1.split('.')[0];
        const major2 = v2.split('.')[0];
        return major1 === major2;
    }

    /**
     * Bumps the version based on change type.
     */
    static bump(current: string, type: 'major' | 'minor' | 'patch'): string {
        const [major, minor, patch] = current.split('.').map(Number);
        switch (type) {
            case 'major': return `${major + 1}.0.0`;
            case 'minor': return `${major}.${minor + 1}.0`;
            case 'patch': return `${major}.${minor}.${patch + 1}`;
            default: return current;
        }
    }
}
