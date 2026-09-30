Set shell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

' Backend hidden
shell.Run "cmd /c cd /d D:\RevenueReport\backend && npm.cmd run dev", 0, False

' Frontend hidden
shell.Run "cmd /c cd /d D:\RevenueReport\frontend && npm.cmd run dev", 0, False

' Wait for servers
WScript.Sleep 7000

' Temporary Revenue Report browser profile
profilePath = shell.ExpandEnvironmentStrings("%TEMP%") & "\RevenueReportProfile"

' Delete old login/session data
If fso.FolderExists(profilePath) Then
    On Error Resume Next
    fso.DeleteFolder profilePath, True
    On Error GoTo 0
End If

' Chrome path
chromePath = ""

If fso.FileExists("C:\Program Files\Google\Chrome\Application\chrome.exe") Then
    chromePath = "C:\Program Files\Google\Chrome\Application\chrome.exe"
ElseIf fso.FileExists("C:\Program Files (x86)\Google\Chrome\Application\chrome.exe") Then
    chromePath = "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"
End If

' Always fresh login
If chromePath <> "" Then
    shell.Run """" & chromePath & """ --new-window --user-data-dir=""" & profilePath & """ http://127.0.0.1:5173/login", 1, False
Else
    shell.Run "http://127.0.0.1:5173/login", 1, False
End If
