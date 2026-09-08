param([string]$Path = (Join-Path $PSScriptRoot '..'))
$ErrorActionPreference = 'Stop'
$studioRoot = (Resolve-Path -LiteralPath $Path).Path
$volumeRoot = [System.IO.Path]::GetPathRoot($studioRoot)
if (-not ('StudioStorage.Native' -as [type])) {
    Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;
namespace StudioStorage {
    public static class Native {
        [DllImport("kernel32.dll", CharSet = CharSet.Unicode, SetLastError = true)]
        public static extern bool GetDiskFreeSpaceW(string root, out uint sectorsPerCluster,
            out uint bytesPerSector, out uint freeClusters, out uint totalClusters);
    }
}
'@
}
$sectorsPerCluster = [uint32]0
$bytesPerSector = [uint32]0
$freeClusters = [uint32]0
$totalClusters = [uint32]0
if (-not [StudioStorage.Native]::GetDiskFreeSpaceW($volumeRoot, [ref]$sectorsPerCluster,
        [ref]$bytesPerSector, [ref]$freeClusters, [ref]$totalClusters)) {
    throw 'Unable to read filesystem allocation size.'
}
$clusterBytes = [uint64]$sectorsPerCluster * $bytesPerSector
$rows = @{}
Get-ChildItem -LiteralPath $studioRoot -File -Recurse -Force | ForEach-Object {
    $relative = $_.FullName.Substring($studioRoot.Length + 1)
    $folder = if ($relative.Contains('\')) { $relative.Split('\')[0] } else { '(root files)' }
    if (-not $rows.ContainsKey($folder)) { $rows[$folder] = @{ Files = 0; Bytes = [uint64]0; Allocated = [uint64]0 } }
    $rows[$folder].Files++
    $rows[$folder].Bytes += $_.Length
    $rows[$folder].Allocated += [uint64]([math]::Ceiling($_.Length / $clusterBytes) * $clusterBytes)
}
$details = @($rows.Keys | ForEach-Object {
    [pscustomobject]@{ Folder = $_; Files = $rows[$_].Files; Bytes = $rows[$_].Bytes;
        MiB = [math]::Round($rows[$_].Bytes / 1MB, 2);
        EstimatedAllocatedMiB = [math]::Round($rows[$_].Allocated / 1MB, 2) }
} | Sort-Object Bytes -Descending)
[pscustomobject]@{
    Root = $studioRoot
    FileSystem = ([System.IO.DriveInfo]::new($volumeRoot)).DriveFormat
    AllocationUnitBytes = $clusterBytes
    Files = ($details | Measure-Object Files -Sum).Sum
    MiB = [math]::Round(($details | Measure-Object Bytes -Sum).Sum / 1MB, 2)
    EstimatedAllocatedMiB = [math]::Round(($details | Measure-Object EstimatedAllocatedMiB -Sum).Sum, 2)
    Note = 'Allocation estimate rounds each file to a cluster; excludes directories, sparse/compressed files and hard-link deduplication.'
    Folders = $details
} | ConvertTo-Json -Depth 4
