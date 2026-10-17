# Free/local .NET sandbox investigation — 12 October 2026

**Use a local Linux sandbox with a current .NET 10 SDK.** No paid VPS is needed for testing on this laptop. This is a proposed setup, not an installed or verified service; VB.NET Run remains disabled.

## What was checked

- The Piston runtime endpoint advertised `basic.net` SDK `5.0.201`. An authored Hello World availability probe to its execution endpoint returned **401**: public execution is whitelist-only. Its maintainers document this restriction from 15 February 2026. No student work, account data, or credentials were sent. [Piston documentation](https://github.com/engineer-man/piston#public-api).
- .NET 5 is outside support and does not match the course's accepted .NET 8/10 contract or the modern SQLite dependency. .NET 10 is the longer-lived target; .NET 8 support ends on 10 November 2026. [Microsoft support policy](https://dotnet.microsoft.com/en-us/platform/support/policy/dotnet-core).
- Local machine: **HP ProBook 450 G5**, Windows 11 Pro build 26200, Intel i5-8250U, approximately **8 GB RAM**, and **63 GB free on C:** at inspection. The processor reports virtualization extensions and SLAT support, but firmware virtualization is **disabled**, and no hypervisor is active. WSL and Docker are not currently installed.
- The selected Hostinger account showed no active VPS. No paid hosting, account, API token, subscription, firmware setting, Windows feature, or service was created or changed.

## Local options

| Route | Hosting cost | Prerequisites | Scope |
| --- | --- | --- | --- |
| WSL 2 + Ubuntu + Docker Engine | No paid hosting subscription | Firmware virtualization; WSL install; Linux Docker setup | Preferred route for a local console sandbox without Docker Desktop licensing |
| WSL 2 + Docker Desktop | No paid hosting for eligible personal/educational use under Docker's terms | Firmware virtualization; WSL install; Docker setup and agreement | Easier Windows management; the user must review/accept its terms |
| Public Piston API | Not freely callable without approval | Provider-issued authorization; modern compatible runtime and libraries would still be needed | Not connected; current endpoint is unsuitable for this integration |
| Native Windows .NET SDK alone | No hosting subscription | SDK install | Can run a student's own trusted project, but does not supply isolation for arbitrary CodeLab submissions |

Sources: [Docker Engine on Ubuntu](https://docs.docker.com/engine/install/ubuntu/), [Docker Desktop requirements and licensing](https://docs.docker.com/desktop/setup/install/windows-install/), [Microsoft WSL installation](https://learn.microsoft.com/en-us/windows/wsl/install).

## First required step

The laptop reports firmware virtualization as disabled. Enable Intel virtualization in its BIOS/UEFI, save, and boot Windows again. BIOS actions occur outside the current Windows automation session and need the person at the computer. Follow the manufacturer's instructions; on an organization-managed computer, use its administrator rather than bypassing restrictions. Save open work before restarting. Do not alter unrelated firmware settings.

[HP's virtualization guide](https://support.hp.com/us-en/document/ish_5637142-5637191-16) describes entering BIOS with F10 during startup and enabling **Virtualization Technology (VTx)**. On many HP business models the setting is under **Advanced → System Options**; menus vary, so follow the applicable HP procedure rather than assuming the same layout on every model. Save with F10 and boot Windows.

After reboot, run this **read-only** check in the project folder:

```powershell
powershell -NoProfile -File scripts/check-vbnet-sandbox-host.ps1
```

The script reports virtualization, WSL, and Windows Docker readiness. It never marks the sandbox verified, installs software, or modifies `.env`. An Engine installed solely inside WSL is not detected by the Windows Docker check.

## Installation and verification sequence

1. Confirm firmware virtualization is enabled. Install WSL 2 with Microsoft's official method; it can require administrator access and a reboot. Review the installer/administrator prompts yourself.
2. Install Ubuntu and Docker Engine inside WSL using Docker's official Ubuntu instructions, or choose Docker Desktop after reviewing its terms. Start with sequential jobs on this 8 GB laptop; concurrent classroom capacity is not established.
3. Build a current patched .NET 10 image containing the VB compiler and pre-restored `Microsoft.Data.Sqlite` practice dependencies. Keep restore/build network access separate from all student execution. No student-triggered NuGet downloads.
4. Implement the existing private service contract from `docs/VBNET_COURSE.md`. Authenticate locally, expose the API on loopback, and use trusted local HTTPS so the Laravel adapter's TLS requirement remains intact. Do not weaken TLS validation or publish an unauthenticated execution endpoint.
5. Compile and run each job inside disposable isolation with no network, host directories, Docker socket, platform credentials, or production DB. Enforce time, memory, process, file, and output limits; terminate the entire job and clean it up. Keep compiler and runner permissions distinct as needed. A plain Docker install or a passing Hello World does not demonstrate these protections.
6. Run all 13 authored console examples, including stdin, private file handling, and SQLite. Verify compilation/runtime errors, repeated runs, concurrent rejection, and cleanup. Probe infinite loops, excessive output/memory/processes, blocked networking, forbidden filesystem access, and data leakage between jobs. Review container policy and the actual deployed service configuration as well as observed probe results.
7. Only after passing verification, connect the local **test** Laravel environment and enable its Run button. Keep the normal Hostinger installation disabled unless it has a separately accessible and verified service. The local laptop service is not automatically reachable from Hostinger; no tunnel or public exposure is configured.

No service implementation or live isolation tests have been completed in this investigation. Windows Forms remains a real Visual Studio desktop workflow; a Linux console sandbox will not execute its GUI.
