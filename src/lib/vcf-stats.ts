// Browser-side VCF parser. Pulls structural facts a vet bioinformatics
// advisor would care about: variant count, INFO keys present, sample columns,
// somatic flag presence, chromosome distribution, FILTER values.
//
// We never throw on malformed input — the advisor degrades to "no notes" if
// stats are unparseable, and Submit must never break on an advisory failure.

export interface VcfStats {
  variantCount: number
  formatColumns: string[]
  hasMatchedNormal: boolean
  infoKeys: string[]
  hasSomaticFlag: boolean
  chromosomes: string[]
  filterValues: string[]
  fileFormat: string | null
  reference: string | null
  fileSize: number
  sampleLines: string[]
}

const MAX_BYTES = 5 * 1024 * 1024  // cap reads at 5 MB — enough for stats on any reasonable VCF
const MAX_VARIANT_ROWS_SCANNED = 200

function emptyStats(fileSize: number): VcfStats {
  return {
    variantCount: 0,
    formatColumns: [],
    hasMatchedNormal: false,
    infoKeys: [],
    hasSomaticFlag: false,
    chromosomes: [],
    filterValues: [],
    fileFormat: null,
    reference: null,
    fileSize,
    sampleLines: [],
  }
}

export async function parseVcfStats(file: File): Promise<VcfStats> {
  try {
    const slice = file.slice(0, MAX_BYTES)
    const text = await slice.text()
    return statsFromText(text, file.size)
  } catch {
    return emptyStats(file.size)
  }
}

function statsFromText(text: string, fileSize: number): VcfStats {
  const stats = emptyStats(fileSize)
  const lines = text.split(/\r?\n/)

  const infoKeys = new Set<string>()
  const chromosomes = new Set<string>()
  const filterValues = new Set<string>()
  let variantRowsScanned = 0

  for (const raw of lines) {
    const line = raw.trim()
    if (!line) continue

    if (line.startsWith("##")) {
      const fmt = line.match(/^##fileformat=(.+)$/i)
      if (fmt) { stats.fileFormat = fmt[1]; continue }
      const ref = line.match(/^##reference=(.+)$/i)
      if (ref) { stats.reference = ref[1]; continue }
      continue
    }

    if (line.startsWith("#CHROM")) {
      const cols = line.slice(1).split("\t")
      // Standard fixed columns: CHROM POS ID REF ALT QUAL FILTER INFO (FORMAT) (samples...)
      if (cols.length > 9) {
        stats.formatColumns = cols.slice(9).map((s) => s.trim()).filter(Boolean)
        const upper = stats.formatColumns.map((c) => c.toUpperCase())
        stats.hasMatchedNormal = upper.some((c) => c.includes("TUMOR")) && upper.some((c) => c.includes("NORMAL"))
      }
      continue
    }

    // Variant row
    stats.variantCount += 1
    if (variantRowsScanned >= MAX_VARIANT_ROWS_SCANNED) continue
    variantRowsScanned += 1

    const fields = line.split("\t")
    if (fields.length >= 8) {
      const chrom  = fields[0]
      const filter = fields[6]
      const info   = fields[7]

      if (chrom)  chromosomes.add(chrom)
      if (filter) filterValues.add(filter)

      if (info) {
        for (const kv of info.split(";")) {
          const k = kv.split("=")[0]?.trim()
          if (k) infoKeys.add(k)
        }
        if (/(?:^|;)SOMATIC(?:=|;|$)/i.test(info)) {
          stats.hasSomaticFlag = true
        }
      }
    }

    if (stats.sampleLines.length < 3) stats.sampleLines.push(line)
  }

  stats.infoKeys     = Array.from(infoKeys).sort()
  stats.chromosomes  = Array.from(chromosomes).sort()
  stats.filterValues = Array.from(filterValues).sort()
  return stats
}
