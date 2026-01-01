# Hostel Management System 2.0.1 - NSIS Installer Script

!include "MUI2.nsh"

; General
Name "Hostel Management System"
OutFile "Hostel Management System Setup 2.0.1.exe"
InstallDir "$PROGRAMFILES\Hostel Management System"
InstallDirRegKey HKCU "Software\HostelManagementSystem" "InstallDir"
RequestExecutionLevel admin

; Variables
Var StartMenuFolder

; Interface Settings
!define MUI_ABORTWARNING
!define MUI_ICON "${NSISDIR}\Contrib\Graphics\Icons\modern-install.ico"
!define MUI_UNICON "${NSISDIR}\Contrib\Graphics\Icons\modern-uninstall.ico"

; Welcome page
!insertmacro MUI_PAGE_WELCOME

; License page (optional)
; !insertmacro MUI_PAGE_LICENSE "license.txt"

; Directory page
!insertmacro MUI_PAGE_DIRECTORY

; Start menu page
!define MUI_STARTMENUPAGE_REGISTRY_ROOT "HKCU"
!define MUI_STARTMENUPAGE_REGISTRY_KEY "Software\HostelManagementSystem"
!define MUI_STARTMENUPAGE_REGISTRY_VALUENAME "Start Menu Folder"
!insertmacro MUI_PAGE_STARTMENU Application $StartMenuFolder

; Components page
!insertmacro MUI_PAGE_COMPONENTS

; Instfiles page
!insertmacro MUI_PAGE_INSTFILES

; Finish page
!define MUI_FINISHPAGE_RUN "$INSTDIR\Hostel Management System.exe"
!insertmacro MUI_PAGE_FINISH

; Uninstaller pages
!insertmacro MUI_UNPAGE_WELCOME
!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES
!insertmacro MUI_UNPAGE_FINISH

; Languages
!insertmacro MUI_LANGUAGE "English"

; Version Information
VIProductVersion "2.0.1.0"
VIAddVersionKey "ProductName" "Hostel Management System"
VIAddVersionKey "ProductVersion" "2.0.1"
VIAddVersionKey "CompanyName" "Hostel Management Team"
VIAddVersionKey "FileDescription" "Modern Hostel Management System"
VIAddVersionKey "FileVersion" "2.0.1.0"
VIAddVersionKey "LegalCopyright" "© 2025 Hostel Management Team"

; Main installer section
Section "Hostel Management System (required)" SecMain
  SectionIn RO
  
  SetOutPath "$INSTDIR"
  
  ; Copy all files from the packaged application
  File /r "dist-electron\Hostel Management System-win32-x64\*.*"
  
  ; Store installation folder
  WriteRegStr HKCU "Software\HostelManagementSystem" "InstallDir" $INSTDIR
  
  ; Create uninstaller
  WriteUninstaller "$INSTDIR\Uninstall.exe"
  
  ; Add uninstall information to Add/Remove Programs
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\HostelManagementSystem" "DisplayName" "Hostel Management System 2.0.1"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\HostelManagementSystem" "DisplayVersion" "2.0.1"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\HostelManagementSystem" "Publisher" "Hostel Management Team"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\HostelManagementSystem" "UninstallString" "$INSTDIR\Uninstall.exe"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\HostelManagementSystem" "InstallLocation" "$INSTDIR"
  WriteRegDWORD HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\HostelManagementSystem" "NoModify" 1
  WriteRegDWORD HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\HostelManagementSystem" "NoRepair" 1
  
SectionEnd

; Desktop shortcut section
Section "Desktop Shortcut" SecDesktop
  CreateShortCut "$DESKTOP\Hostel Management System.lnk" "$INSTDIR\Hostel Management System.exe" "" "$INSTDIR\Hostel Management System.exe" 0
SectionEnd

; Start Menu shortcuts section
Section "Start Menu Shortcuts" SecStartMenu
  !insertmacro MUI_STARTMENU_WRITE_BEGIN Application
  
  CreateDirectory "$SMPROGRAMS\$StartMenuFolder"
  CreateShortCut "$SMPROGRAMS\$StartMenuFolder\Hostel Management System.lnk" "$INSTDIR\Hostel Management System.exe" "" "$INSTDIR\Hostel Management System.exe" 0
  CreateShortCut "$SMPROGRAMS\$StartMenuFolder\Uninstall.lnk" "$INSTDIR\Uninstall.exe"
  
  !insertmacro MUI_STARTMENU_WRITE_END
SectionEnd

; Section descriptions
LangString DESC_SecMain ${LANG_ENGLISH} "Main application files (required)"
LangString DESC_SecDesktop ${LANG_ENGLISH} "Create a shortcut on the desktop"
LangString DESC_SecStartMenu ${LANG_ENGLISH} "Create shortcuts in the Start Menu"

!insertmacro MUI_FUNCTION_DESCRIPTION_BEGIN
  !insertmacro MUI_DESCRIPTION_TEXT ${SecMain} $(DESC_SecMain)
  !insertmacro MUI_DESCRIPTION_TEXT ${SecDesktop} $(DESC_SecDesktop)
  !insertmacro MUI_DESCRIPTION_TEXT ${SecStartMenu} $(DESC_SecStartMenu)
!insertmacro MUI_FUNCTION_DESCRIPTION_END

; Uninstaller section
Section "Uninstall"
  
  ; Remove files and uninstaller
  Delete "$INSTDIR\*.*"
  RMDir /r "$INSTDIR"
  
  ; Remove shortcuts
  Delete "$DESKTOP\Hostel Management System.lnk"
  
  !insertmacro MUI_STARTMENU_GETFOLDER Application $StartMenuFolder
  Delete "$SMPROGRAMS\$StartMenuFolder\Hostel Management System.lnk"
  Delete "$SMPROGRAMS\$StartMenuFolder\Uninstall.lnk"
  RMDir "$SMPROGRAMS\$StartMenuFolder"
  
  ; Remove registry keys
  DeleteRegKey /ifempty HKCU "Software\HostelManagementSystem"
  DeleteRegKey HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\HostelManagementSystem"
  
SectionEnd