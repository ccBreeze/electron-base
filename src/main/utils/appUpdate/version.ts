/**
 * 比较版本号
 *
 * @url https://leetcode.cn/problems/compare-version-numbers/description/
 * @returns 比较结果。如果version1大于version2返回1，小于返回-1，等于返回0。
 */
export function compareVersion(version1: string, version2: string) {
  if (version1 === version2) return 0

  const n = version1.length
  const m = version2.length
  let i = 0
  let j = 0

  while (i < n || j < m) {
    let v1 = ''
    while (i < n) {
      const char = version1[i++]
      if (char === '.') break
      v1 += char
    }

    let v2 = ''
    while (j < m) {
      const char = version2[j++]
      if (char === '.') break
      v2 += char
    }

    // 比较
    if (+v1 !== +v2) return +v1 > +v2 ? 1 : -1
  }

  return 0
}
