import { writeFile } from 'node:fs/promises';
const lessons = [
    {
        title: 'Introduction to Microsoft Word',
        exercise: 'My First Microsoft Word Document',
        filename: 'My_First_Word_Document.docx',
        why: 'A saved, named document can be reopened and revised without retyping school work. Word is a word processor for letters, reports, resumes and projects; it is not the same as the Windows file manager.',
        topics: [
            'Starting and closing Word',
            'Blank Document',
            'Open an existing document',
            'Title Bar',
            'Ribbon, tabs and groups',
            'Quick Access Toolbar',
            'Ruler and scroll bar',
            'Status Bar and zoom',
            'Document area',
            'Save and Save As',
            'Reopening a saved document',
        ],
        terms: {
            Ribbon: 'The tabbed command area above the document. A tab contains related command groups.',
            Document:
                'The editable file containing text, formatting and other objects.',
            Save: 'Writes changes to the current file; Save As creates a separately named copy or changes file type.',
            Zoom: 'Changes on-screen magnification without changing printed text size.',
        },
        steps: [
            'Start the authorized Microsoft Word desktop application from Start; choose Blank Document.',
            'Locate the title bar, Home tab, Font and Paragraph groups, document area and status bar. Use View > Ruler if the ruler is hidden.',
            'Type the exercise title, press Enter once, then type the paragraph below. Use the scroll bar and zoom slider to inspect the page.',
            'Choose File > Save As > Browse (or your school-approved location). Enter My_First_Word_Document and select Word Document (.docx).',
            'Press Ctrl+S after editing. Close Word using File > Close or the window Close button.',
            'Reopen Word > File > Open > Browse. Choose the saved file, read the title and paragraph, and confirm the saved filename.',
        ],
        text: 'My name is ____________. I am learning how to use Microsoft Word. Microsoft Word can be used to create letters, reports, school projects, resumes, and many other documents.',
        tasks: [
            'Create a blank document with the title and supplied paragraph.',
            'Replace the blank with a fictional name during practice.',
            'Save with the exact filename, close Word and reopen the saved file.',
            'Confirm both title and paragraph remain; upload the reopened saved document.',
        ],
        mistakes: [
            'Closing before the first save loses an unnamed document.',
            'Changing zoom does not make printed text larger.',
        ],
        trouble: [
            'If the file is missing, inspect File > Open > Recent, then browse the folder you selected. Search for the filename, not just Document1.',
            'If Word opens read-only, use a school-approved writable folder and Save As a new practice copy.',
        ],
        command: [
            'Which command creates a separately named copy?',
            'Save As',
            'Zoom',
            'Scroll Bar',
            'Print Preview',
        ],
        scenario: [
            'You closed Word and want to check that your work survived. What should you do?',
            'Reopen the saved .docx file and inspect its contents',
            'Create another blank document',
            'Only increase zoom',
            'Rename a shortcut',
        ],
        independent:
            'Without this guide, create, save, close and reopen a three-sentence description of your favorite school subject.',
    },
    {
        title: 'Character Formatting and Text Editing',
        exercise: 'School Announcement',
        filename: 'School_Announcement.docx',
        why: 'Formatting a selected range creates a clear reading hierarchy. Character formatting changes letters; paragraph alignment changes the paragraph. Selecting the correct range prevents accidental changes to the whole document.',
        topics: [
            'Selecting and highlighting text',
            'Cut, Copy and Paste',
            'Undo and Redo',
            'Delete and Backspace',
            'Select All',
            'Font family and size',
            'Bold, Italic and Underline',
            'Font Color and Text Highlight Color',
            'Change Case',
            'Superscript and Subscript',
            'Clear All Formatting',
            'Format Painter',
            'Ctrl+A/C/X/V/Z/Y/B/I/U/S',
        ],
        terms: {
            Selection: 'The highlighted range that receives the next command.',
            Bold: 'Makes the selected characters thicker; Home > Font > Bold or Ctrl+B.',
            Highlight:
                'Adds a marker-like background behind text; it differs from font color.',
            Format_Painter:
                'Copies formatting from one selection to another without copying the words.',
        },
        steps: [
            'Drag across SCHOOL ANNOUNCEMENT. In Home > Font choose a readable font, set 18 pt and click Bold. Center the title with Home > Paragraph > Center.',
            'Select only the title and open Font Color; choose a dark, readable color. Compare the selection with unselected text.',
            'Select Friday at 8:00 AM and press Ctrl+B. Select the participation sentence and press Ctrl+I.',
            'Select cleaning materials and apply Text Highlight Color. Practice Underline with Ctrl+U on a temporary practice phrase, then undo it if not needed.',
            'Select the body paragraph; Ctrl+C copies without removal. Move below it, press Ctrl+V, then Ctrl+Z to remove the duplicate. Ctrl+Y repeats the undone edit; undo once more to keep a single paragraph.',
            'On a scratch line try font/size, Change Case, x² using Superscript and H₂O using Subscript. Try Format Painter and Clear All Formatting. Delete the scratch line before submitting.',
            'Use Backspace to remove the character before the cursor and Delete for the character after it. Use Ctrl+X only when you intend to move text. Press Ctrl+S.',
        ],
        text: 'There will be a school clean-up activity on Friday at 8:00 AM. All students are encouraged to participate. Please bring cleaning materials such as brooms, dustpans, and garbage bags.',
        tasks: [
            'Create SCHOOL ANNOUNCEMENT above the supplied paragraph.',
            'Make the title bold, 18 pt, centered and a readable font color.',
            'Bold Friday at 8:00 AM; italicize All students are encouraged to participate.',
            'Highlight cleaning materials; copy/paste the paragraph and undo the duplicate.',
            'Explain in your reflection how selection controls which characters change.',
        ],
        mistakes: [
            'Pressing Ctrl+A before Bold formats all text instead of one phrase.',
            'Text Highlight Color changes the background, while Font Color changes the letters.',
        ],
        trouble: [
            'If the next words are unexpectedly bold, toggle Bold off or clear formatting on the new selection.',
            'If copied text looks different, inspect Paste Options and choose the intended source or destination formatting.',
        ],
        command: [
            'Which Home command makes only selected text darker and thicker?',
            'Bold',
            'Justify',
            'Page Break',
            'Zoom',
        ],
        scenario: [
            'Your entire paragraph became bold when only a date should be bold. What is the best correction?',
            'Undo, select only the date and apply Bold',
            'Delete the document',
            'Change page size',
            'Make all paragraphs headings',
        ],
        independent:
            'Format a new title and two emphasized phrases without following the demonstration steps.',
    },
    {
        title: 'Paragraph Formatting',
        exercise: 'My Daily School Routine',
        filename: 'Daily_School_Routine.docx',
        why: 'Paragraph settings control alignment, line spacing and indentation consistently. Using paragraph commands instead of repeated spaces and blank lines makes a document easier to revise and read.',
        topics: [
            'Paragraphs and paragraph marks',
            'Left, Center, Right and Justify',
            'Line spacing',
            'Paragraph before/after spacing',
            'First-line and hanging indents',
            'Left and right indents',
            'Bullets',
            'Numbering',
            'Multilevel lists',
            'Paragraph borders and shading',
        ],
        terms: {
            Paragraph:
                'A block ending at an Enter paragraph mark. Soft-wrapped lines remain one paragraph.',
            Line_spacing: 'Vertical distance between lines inside a paragraph.',
            Paragraph_spacing:
                'Space before or after an entire paragraph; different from line spacing.',
            Hanging_indent:
                'The first line stays farther left while subsequent lines move inward.',
        },
        steps: [
            'Type the title and one paragraph about your school day. Turn Home > Show/Hide ¶ on to see paragraph endings.',
            'Click in the title paragraph and choose Center. Click in the body paragraph and choose Justify. Compare Left, Center and Right on a practice copy.',
            'Select the body paragraph. Home > Paragraph > Line and Paragraph Spacing > 1.5 changes line spacing.',
            'Open the Paragraph dialog. Set a first-line indent of 1.27 cm (0.5 inch); choose a small consistent After spacing, such as 6 pt. Do not indent with five spaces.',
            'Type each routine item on its own paragraph. Select the five items and choose Numbering. Type the supplies on separate paragraphs and choose Bullets.',
            'On a scratch bibliography paragraph set Special > Hanging and compare its first and remaining lines. Try left/right indents and a two-level list using Multilevel List.',
            'Select a paragraph, apply light Shading and a visible Bottom Border. Keep text readable and restore any scratch examples not required by your final document.',
        ],
        text: 'Wake up\nPrepare for school\nAttend classes\nComplete assignments\nReview lessons\n\nNotebook\nBallpen\nPencil\nRuler\nSchool ID',
        tasks: [
            'Center My Daily School Routine and write a short original school-day paragraph.',
            'Justify the paragraph; apply 1.5 line spacing, first-line indent and deliberate paragraph spacing.',
            'Create the five-item automatic numbered routine and five-item bulleted supply list.',
            'Use a readable border or shading to distinguish one paragraph; save.',
        ],
        mistakes: [
            'Manual spaces and typed numbers do not behave like automatic indents and list numbering.',
            'Repeated Enter creates extra paragraphs rather than reliable paragraph spacing.',
        ],
        trouble: [
            'If 1.5 spacing seems unchanged, check that the correct paragraph is selected and inspect its Paragraph dialog.',
            'If a bullet continues on an empty line, press Enter again to end the list. Use the ruler markers or dialog to fix inconsistent indentation.',
        ],
        command: [
            'Which command creates space between lines within one paragraph?',
            'Line and Paragraph Spacing',
            'Font Color',
            'Save As',
            'Crop',
        ],
        scenario: [
            'A reference needs the first line left and the remaining lines indented. Which setting fits?',
            'Hanging indent',
            'Landscape',
            'Superscript',
            'Copy',
        ],
        independent:
            'Create a new paragraph with 1.5 spacing and a first-line indent, plus an automatically numbered three-step list.',
    },
    {
        title: 'Page Setup and Document Layout',
        exercise: 'School Newsletter',
        filename: 'School_Newsletter.docx',
        why: 'Page layout determines the physical page, while headers and footers repeat useful information. Previewing the actual pages catches clipped text and accidental blank pages before printing.',
        topics: [
            'Page size',
            'Margins',
            'Portrait and Landscape',
            'Page breaks',
            'Columns',
            'Page borders and page color',
            'Headers and footers',
            'Page numbers',
            'Print Preview and printing concepts',
        ],
        terms: {
            Margin: 'The empty area between page edges and main text.',
            Orientation:
                'Portrait is taller than wide; Landscape is wider than tall.',
            Page_break: 'Starts a new page without repeatedly pressing Enter.',
            Header_footer:
                'Areas above and below main text that can repeat across pages.',
        },
        steps: [
            'Create NANCAPIAN SCHOOL NEWS. Layout > Size selects your teacher’s page size; Layout > Margins > Normal applies consistent margins.',
            'Compare Layout > Orientation > Landscape and Portrait on a practice copy. Keep the orientation that fits your newsletter.',
            'Enter School Activities, Student Achievements and Upcoming Events with short paragraphs. Select the body sections, then Layout > Columns > Two. Keep the main title outside the columns when needed.',
            'Insert > Header: type the school name. Insert > Page Number: choose a footer location and confirm numbers appear automatically.',
            'Design > Page Borders adds a simple page border. If testing Page Color, keep readable contrast and understand printer background settings may differ.',
            'Use Insert > Page Break to deliberately start a new page where appropriate. File > Print opens Print Preview; inspect all pages, margins and page numbers without sending a print job.',
        ],
        text: 'School Activities\nOur school hosted a reading activity.\nStudent Achievements\nLearners completed their projects.\nUpcoming Events\nA classroom exhibition will take place next month.',
        tasks: [
            'Use the exact newsletter title and three supplied section headings.',
            'Apply proper margins and a simple page border.',
            'Use two columns for the body and a school-name header.',
            'Insert automatic footer page numbers; inspect Print Preview and explain one check you made.',
        ],
        mistakes: [
            'Typing page numbers into the body does not update them automatically.',
            'Selecting all text for Columns can incorrectly place the main title inside a narrow column.',
        ],
        trouble: [
            'If there is an unexpected blank page, turn on ¶ and inspect page/section breaks.',
            'If a border is clipped in preview, move it inside the printable area using Page Border Options.',
        ],
        command: [
            'Which command changes a page from tall to wide?',
            'Layout > Orientation > Landscape',
            'Bold',
            'Mail Merge',
            'Track Changes',
        ],
        scenario: [
            'You want the school name to repeat at the top of every page. Where should it go?',
            'Header',
            'A manually repeated body paragraph',
            'Clipboard',
            'Filename',
        ],
        independent:
            'Make a one-page two-column notice with an automatic page number and check its print preview.',
    },
    {
        title: 'Pictures, Shapes, Text Boxes, and Tables',
        exercise: 'Student Information Sheet',
        filename: 'Student_Information.docx',
        why: 'Objects and tables organize a document visually. Keeping images proportional and choosing deliberate wrapping prevents pictures from covering text or distorting when the page changes.',
        topics: [
            'Insert picture',
            'Resize and Crop',
            'Text wrapping',
            'Shapes, Fill and Outline',
            'Text Box',
            'WordArt',
            'Icons where available',
            'Insert table',
            'Add/delete rows and columns',
            'Merge and Split Cells',
            'Table styles',
        ],
        terms: {
            Text_wrapping:
                'Controls how text flows around an object; In Line with Text treats it like a character.',
            Crop: 'Hides unwanted outer parts without stretching the image.',
            Merge_cells:
                'Combines selected neighboring cells into a single cell.',
            Alt_text:
                'A useful description of a meaningful image for readers who cannot see it.',
        },
        steps: [
            'Insert > Table: choose two columns and five rows. Put Name, Grade/Year, Section, Adviser and Contact Number in the left column and fictional data in the right.',
            'Use Table Design > Table Styles and a clear header. In Table Layout practice Insert Below, Delete Rows, Merge Cells and Split Cells on a temporary copy.',
            'Insert > Pictures: choose an image you are allowed to use. Drag a corner handle to resize proportionally; Picture Format > Crop trims unnecessary edges.',
            'Choose Layout Options > Square for a movable picture; compare In Line with Text. Position it so no text is hidden. Add alt text to a meaningful image.',
            'Insert > Text Box: add Welcome to Microsoft Word! Insert one simple shape, then choose Shape Fill and Shape Outline.',
            'Try WordArt and Icons if your Word edition offers them; retain only useful decoration. Check the table and picture in Print Preview and save.',
        ],
        text: 'Name | Example Learner\nGrade/Year | Grade 11\nSection | Example Section\nAdviser | Example Teacher\nContact Number | Fictional practice value',
        tasks: [
            'Create a readable STUDENT INFORMATION table with all five fields.',
            'Apply a table style, insert a permitted image and resize it proportionally.',
            'Apply deliberate text wrapping and a useful image description.',
            'Add the welcome text box and one decorative shape; use fictional contact details only.',
        ],
        mistakes: [
            'Dragging a side handle can stretch a picture.',
            'Merged cells can make table reading order harder; keep the data table simple.',
        ],
        trouble: [
            'If the picture covers text, change Layout Options to In Line with Text or Square and reposition.',
            'If a row disappears, use Undo; then verify which cells/rows were selected before deleting.',
        ],
        command: [
            'Which command trims unwanted outside areas of a picture?',
            'Crop',
            'Merge Cells',
            'Superscript',
            'Save As',
        ],
        scenario: [
            'Your picture is stretched after resizing. How should you fix it?',
            'Undo and resize proportionally from a corner handle',
            'Change all text to bold',
            'Add blank lines',
            'Merge the table',
        ],
        independent:
            'Create a new three-row information table and place a proportional image beside it without covering text.',
    },
    {
        title: 'Advanced Tables and Document Organization',
        exercise: 'Student Grade Report',
        filename: 'Student_Grade_Report.docx',
        why: 'Consistent table headings, numeric alignment and controlled widths let readers compare school records accurately. Section breaks and tab stops solve layout problems that repeated spaces cannot.',
        topics: [
            'Borders and cell shading',
            'Cell alignment',
            'Row height and column width',
            'Repeat header rows',
            'Sort table data',
            'Convert text to table and table to text',
            'Tab stops',
            'Section breaks',
        ],
        terms: {
            Header_row:
                'A labeled first row that can repeat when a table continues to another page.',
            Cell_alignment:
                'Positions cell content vertically and horizontally.',
            Tab_stop:
                'A defined position reached by Tab instead of many spaces.',
            Section_break:
                'Separates page-formatting regions; it is not the same as a page break.',
        },
        steps: [
            'Insert a five-column table labeled Student, English, Math, Science and Average. Enter the supplied fictional scores.',
            'Select the header row; apply bold, high-contrast shading and clear borders in Table Design.',
            'Select score cells and use Table Layout > Alignment to center the numbers. Adjust column widths so names and headings are readable.',
            'Select the first row and choose Table Layout > Repeat Header Rows. Test a multi-page copy to see the header repeat.',
            'Table Layout > Sort sorts the entire table by Student while treating the first row as a header. Verify each learner’s scores stay together.',
            'Practice Convert Text to Table using tab-separated sample text, then Convert to Text on a copy. Set a ruler tab stop for a small signature line.',
            'Create a temporary Layout > Breaks > Next Page section and compare it with a page break. Remove practice-only sections before saving the report.',
        ],
        text: 'Student | English | Math | Science | Average\nAnna | 90 | 88 | 92 | 90.00\nBen | 85 | 89 | 87 | 87.00\nCarla | 94 | 93 | 95 | 94.00',
        tasks: [
            'Create the supplied grade report with a title.',
            'Format the header, add borders/shading, center numbers and resize columns.',
            'Include the arithmetic averages shown and verify them manually.',
            'Demonstrate a repeated header on a multi-page practice copy and explain how section breaks differ from page breaks.',
        ],
        mistakes: [
            'Sorting one selected column can separate names from their scores.',
            'A fixed row height can hide wrapped text.',
        ],
        trouble: [
            'If a repeated header does not appear, let the table continue automatically rather than inserting a manual break inside it.',
            'If numbers are cut off, increase cell width or use an automatic row height.',
        ],
        command: [
            'Which command repeats column labels on later table pages?',
            'Repeat Header Rows',
            'Change Case',
            'WordArt',
            'Track Changes',
        ],
        scenario: [
            'After sorting, Anna has Ben’s scores. What should you do?',
            'Undo and sort the complete table with its header identified',
            'Only retype the names',
            'Delete the header',
            'Add shading',
        ],
        independent:
            'Build and sort a four-row score table without separating student names from their marks.',
    },
    {
        title: 'Styles, Themes, and Navigation',
        exercise: 'Technology in Education',
        filename: 'Technology_in_Education.docx',
        why: 'Styles describe document structure rather than just appearance. Using real heading styles makes navigation, consistent editing and automatic contents possible.',
        topics: [
            'Normal',
            'Heading 1, Heading 2 and Heading 3',
            'Modify Style',
            'Themes, colors and fonts',
            'Navigation Pane',
            'Page breaks and section breaks',
        ],
        terms: {
            Style: 'A reusable set of character and paragraph formatting.',
            Heading_1: 'A top-level heading style used for major sections.',
            Theme: 'Coordinated colors, fonts and effects used by the document.',
            Navigation_Pane:
                'An outline of real headings that helps readers jump to sections.',
        },
        steps: [
            'Create the title Technology in Education and sections Introduction, Advantages of Technology, Challenges and Conclusion. Add at least one paragraph below each.',
            'Apply Heading 1 to each major section with Home > Styles. Add two subtopics using Heading 2, and practice Heading 3 on a nested subtopic.',
            'Keep body paragraphs in Normal. Right-click a style in the gallery > Modify, change an appropriate setting and confirm all paragraphs using that style update.',
            'Design > Themes selects a consistent theme. Inspect Theme Colors and Fonts instead of manually assigning unrelated fonts to each heading.',
            'View > Navigation Pane: choose Headings and click each heading to navigate. Confirm every intended major section appears.',
            'Insert a page break before a major section; compare a section break only when different page layout is required. Save and reopen.',
        ],
        text: 'Introduction\nAdvantages of Technology\nAccess to learning resources\nCommunication\nChallenges\nConclusion',
        tasks: [
            'Write an original short report using all four required sections.',
            'Use Heading 1 for major sections and Heading 2 for meaningful subtopics.',
            'Apply a consistent theme and verify the Navigation Pane outline.',
            'Use proper page breaks; explain why making text large/bold alone is not a heading style.',
        ],
        mistakes: [
            'A manually bold title may look like a heading but is not listed as a structural heading.',
            'Using Heading 1 for every paragraph destroys the outline.',
        ],
        trouble: [
            'If a heading is absent from navigation, select its paragraph and apply an actual heading style.',
            'If modifying one style changes too much, undo and inspect which paragraphs share that style.',
        ],
        command: [
            'Which feature makes a reusable formatting definition for many paragraphs?',
            'Style',
            'Clipboard',
            'Zoom',
            'Crop',
        ],
        scenario: [
            'A heading looks bold but is missing from the Navigation Pane. What is the likely correction?',
            'Apply a Heading style to that paragraph',
            'Increase zoom',
            'Use a text box',
            'Add a blank line',
        ],
        independent:
            'Create three structured sections and navigate between them using headings only.',
    },
    {
        title: 'References and Academic Document Tools',
        exercise: 'Mini Research Paper',
        filename: 'Computers_in_Modern_Education.docx',
        why: 'References credit sources and let readers locate evidence. Automatic contents, captions and cross-references update more reliably than typed page numbers.',
        topics: [
            'Footnotes and endnotes',
            'Citations and sources',
            'Bibliography',
            'Automatic Table of Contents',
            'Captions',
            'Cross-references',
        ],
        terms: {
            Citation:
                'A short source reference attached to the claim it supports.',
            Bibliography:
                'A generated list of the sources recorded for the document.',
            Footnote:
                'A note linked to a marker, normally at the bottom of the page.',
            Caption: 'A numbered label associated with a figure or table.',
        },
        steps: [
            'Plan The Role of Computers in Modern Education with three Heading 1 sections. Draft original paragraphs and identify two credible sources you actually consulted.',
            'References > Insert Citation > Add New Source: enter accurate author, title and date information for each source. Choose the required citation style.',
            'Place the cursor after the relevant claim and Insert Citation. Never invent an author or source just to satisfy a count.',
            'References > Insert Footnote adds an explanatory note; compare Endnote for notes at the end of a section/document.',
            'Insert an authorized image, then References > Insert Caption; use a meaningful Figure caption.',
            'At the beginning choose References > Table of Contents > Automatic Table. Insert a Bibliography at the end.',
            'Insert a cross-reference to the figure, change a heading and update the contents/fields. Confirm no broken reference is printed.',
        ],
        text: 'The Role of Computers in Modern Education\n1. Learning resources\n2. Classroom communication\n3. Responsible use',
        tasks: [
            'Write three structured sections with original explanation.',
            'Insert two real citations, one footnote and one image with caption.',
            'Generate an automatic Table of Contents and bibliography.',
            'Update fields and inspect page references before submitting.',
        ],
        mistakes: [
            'Typing a source name without a recorded source is not an automatic citation.',
            'A manually typed contents list does not update after pages move.',
        ],
        trouble: [
            'If the Table of Contents is empty, apply Heading styles and update the whole table.',
            'If a citation displays the wrong data, use Manage Sources/Edit Source and update fields.',
        ],
        command: [
            'Which command produces an updating list of headings and page numbers?',
            'Automatic Table of Contents',
            'Page Color',
            'Copy',
            'WordArt',
        ],
        scenario: [
            'Your document moved to new pages but contents numbers stayed old. What should you do?',
            'Update the Table of Contents and fields',
            'Retype every page number',
            'Change all fonts',
            'Remove headings',
        ],
        independent:
            'Add a real source, insert its citation and regenerate the bibliography without copying the demonstration.',
    },
    {
        title: 'Mail Merge',
        exercise: 'Student Recognition Letters',
        filename: 'Student_Recognition_Letters.docx',
        why: 'Mail Merge combines one standard letter with separate recipient records. Previewing every record prevents sending the wrong name or award to a learner.',
        topics: [
            'Main document',
            'Recipient list',
            'Merge fields',
            'Letters',
            'Labels and envelopes',
            'Preview Results',
            'Finish and Merge',
        ],
        terms: {
            Main_document:
                'The reusable wording and layout shared by all recipients.',
            Recipient_list:
                'A table with one record per recipient and a header for each field.',
            Merge_field:
                'A placeholder populated from the selected recipient column.',
            Merged_document:
                'The generated personalized output, separate from the reusable main document.',
        },
        steps: [
            'Create a recognition letter with a date, greeting, award sentence and closing. Mailings > Start Mail Merge > Letters identifies the document type.',
            'Mailings > Select Recipients > Type a New List: use Name and Award columns for the three supplied fictional records. Save the list in your practice folder.',
            'Place the cursor in the greeting and choose Insert Merge Field > Name. Insert Award in the recognition sentence; do not type the guillemet symbols yourself.',
            'Mailings > Preview Results: move through all three records and check each name/award pair. Fix incorrect columns or spaces in the main document.',
            'Finish & Merge > Edit Individual Documents > All creates a separate output. Inspect all three letters before any printing.',
            'Explore Start Mail Merge > Labels and Envelopes conceptually; paper size and label vendor must match the actual stationery. Save the main document and merged output separately.',
        ],
        text: 'Mia Santos | Outstanding Student\nJohn Cruz | Best in Mathematics\nAnna Reyes | Best in Science',
        tasks: [
            'Create one recognition letter with Name and Award merge fields.',
            'Use exactly the three supplied fictional recipient/award pairs.',
            'Preview all records and generate three personalized letters.',
            'Upload the main document and merged output; describe how you checked the name/award matches.',
        ],
        mistakes: [
            'Typing «Name» as ordinary text does not insert a functioning merge field.',
            'Previewing only the first recipient can hide missing or incorrect later values.',
        ],
        trouble: [
            'If merge fields are blank, check the selected data source, column names and nonempty recipient rows.',
            'If names repeat, check the recipient list and regenerate the merged output rather than editing the same record repeatedly.',
        ],
        command: [
            'Which command lets you check one recipient’s actual values before finishing?',
            'Preview Results',
            'Track Changes',
            'Crop',
            'Font Size',
        ],
        scenario: [
            'A letter shows the literal text Name rather than the learner’s name. What should you check?',
            'Insert a real merge field from the selected recipient column',
            'Increase paragraph spacing',
            'Change page border',
            'Copy the same letter three times',
        ],
        independent:
            'Create a two-recipient practice merge using fictional names and two distinct awards.',
    },
    {
        title: 'Forms and Document Protection',
        exercise: 'Student Registration Form',
        filename: 'Student_Registration_Form.docx',
        why: 'Content controls guide data entry and protection can limit accidental layout changes. Editing restrictions do not encrypt a file or replace careful handling of personal information.',
        topics: [
            'Developer tab',
            'Plain/rich text controls',
            'Checkbox',
            'Drop-down list',
            'Date picker',
            'Restrict Editing',
            'Read-only and protection concepts',
        ],
        terms: {
            Content_control:
                'A structured area for a particular kind of input.',
            Drop_down: 'A controlled list of permitted answers.',
            Restrict_Editing:
                'Limits edits according to the chosen restriction; not the same as encryption.',
            Placeholder:
                'Instructional text replaced by the form user’s entry.',
        },
        steps: [
            'File > Options > Customize Ribbon: enable Developer if your authorized desktop version permits it.',
            'Lay out the form with Name, Birth Date, Grade/Year, Section, Gender, Subjects, Contact Number and Address. Use fictional values for practice.',
            'Insert suitable plain text controls for names/contact/address, a date picker for Birth Date and a drop-down for Grade/Year or Section.',
            'Add checkboxes for subject choices. Open each control’s Properties, provide a useful title and edit drop-down choices.',
            'Developer > Restrict Editing: choose a suitable forms restriction and test it on a copy. Do not set or submit a password that prevents your teacher reviewing the work.',
            'Tab through the form and complete a sample entry; confirm labels remain understandable. Save the editable original and a tested practice copy.',
        ],
        text: 'Name\nBirth Date\nGrade/Year\nSection\nGender (optional practice choice)\nSubjects\nContact Number\nAddress',
        tasks: [
            'Create all listed fields using fillable controls.',
            'Use text, checkbox, drop-down and date controls appropriately.',
            'Test restricted editing on a copy and explain the limitation.',
            'Use fictional personal/contact data and leave a teacher-reviewable copy.',
        ],
        mistakes: [
            'Typing an empty box character is not an interactive checkbox content control.',
            'A locked file with an undisclosed password can prevent teacher assessment.',
        ],
        trouble: [
            'If controls cannot be inserted, check Developer availability and whether you are editing the protected copy.',
            'If users can change labels, inspect the chosen editing restriction and test with a fresh copy.',
        ],
        command: [
            'Which tab contains Word content controls?',
            'Developer',
            'Mailings only',
            'Print Preview',
            'Status Bar',
        ],
        scenario: [
            'You want users to choose only a listed section. Which control fits?',
            'Drop-down list',
            'Unrestricted body text',
            'WordArt',
            'Page Border',
        ],
        independent:
            'Build a small form with one text control, one date and one controlled choice, then test it.',
    },
    {
        title: 'Advanced Styles, Templates, and Long Documents',
        exercise: 'School Research Template',
        filename: 'School_Research_Template.dotx',
        why: 'A template supplies a reusable starting structure. Linked heading styles, sections and separate headers keep long school reports consistent without manual page-by-page repair.',
        topics: [
            'Custom styles and style sets',
            'Templates and DOTX',
            'Multilevel headings',
            'Sections',
            'Different headers/footers',
            'Different first page',
            'Long-document organization',
        ],
        terms: {
            Template:
                'A reusable starting file; .dotx creates documents without storing macros.',
            Section: 'A region with its own page-formatting rules.',
            Link_to_Previous:
                'Connects a section’s header/footer to the preceding section.',
            Multilevel_heading:
                'Numbering linked to Heading styles rather than manually typed section numbers.',
        },
        steps: [
            'Create a cover page and a second-page report area. Define Heading 1–3, Body and Caption styles with readable spacing.',
            'Home > Multilevel List: choose a numbering scheme linked to heading styles. Add sample major and minor headings and test automatic renumbering.',
            'Insert a Next Page section break between cover and main body. In Header/Footer tools choose Different First Page for the intended section.',
            'Where headers must differ between sections, turn Link to Previous off deliberately. Insert page numbers and verify the first body page format.',
            'Save As > Word Template (.dotx). Close it, then create a new document from the template and confirm the original template was not overwritten.',
            'Update the contents and inspect a multi-page sample for orphan headings, extra blank pages and inconsistent headers.',
        ],
        text: 'School Research Template\nCover information\n1 Introduction\n1.1 Background\n2 Discussion\n3 Conclusion',
        tasks: [
            'Create a .dotx research template with cover, heading, body and caption styles.',
            'Include a header, footer and automatic page numbers.',
            'Demonstrate multilevel headings and a deliberate cover/body section boundary.',
            'Submit the template plus a document created from it, and explain how you preserved the reusable original.',
        ],
        mistakes: [
            'Renaming a .docx extension to .dotx is not the same as saving as the correct format.',
            'Removing Link to Previous in the wrong section can change the wrong header.',
        ],
        trouble: [
            'If the cover repeats the body header, inspect section breaks and Different First Page.',
            'If numbering restarts unexpectedly, inspect multilevel list settings linked to the heading styles.',
        ],
        command: [
            'Which file type is a macro-free Word template?',
            'DOTX',
            'EXE',
            'XLSX',
            'TXT',
        ],
        scenario: [
            'A new section must have a different header from the earlier section. What should you inspect?',
            'The section boundary and Link to Previous',
            'Only the font color',
            'The clipboard',
            'Zoom level',
        ],
        independent:
            'Create a document from your template and change one style to update all matching paragraphs.',
    },
    {
        title: 'Advanced References and Research Documents',
        exercise: 'Five-page Academic Report',
        filename: 'Academic_Report.docx',
        why: 'Long reports need accurate, updating references. Captions, cross-references and field updates keep figures and supporting evidence connected after editing.',
        topics: [
            'Table of Contents',
            'Table of Figures',
            'Index concepts',
            'Bookmarks',
            'Captions and cross-references',
            'Citations and bibliography',
            'Footnotes and endnotes',
        ],
        terms: {
            Table_of_Figures:
                'An automatically generated list based on figure captions.',
            Cross_reference:
                'A field pointing to an existing heading, figure, bookmark or other target.',
            Bookmark: 'A named location or range in the document.',
            Index: 'An alphabetical list of marked topics and their page locations; different from contents.',
        },
        steps: [
            'Plan an approximately five-page report with an introduction, evidence sections and conclusion. Apply hierarchical heading styles.',
            'Insert three permitted figures with descriptive alt text; References > Insert Caption supplies sequential Figure labels.',
            'References > Insert Table of Figures builds the list from captions. Insert a Table of Contents from headings.',
            'Insert three accurate citations to sources you actually read; generate the bibliography. Add an appropriate footnote or endnote without duplicating source attribution unnecessarily.',
            'Insert > Bookmark names a useful location. Insert > Cross-reference points to a figure or heading; choose the appropriate reference text/page field.',
            'Practice marking an index entry and generating an index on a copy. After moving a figure, update fields and check the contents, figure list and references for errors.',
        ],
        text: 'Research question\nIntroduction\nEvidence and discussion\nThree captioned figures\nConclusion\nBibliography',
        tasks: [
            'Write an approximately five-page academic report with three figures.',
            'Include captions, Table of Figures and a cross-reference.',
            'Use three real citations, bibliography and automatic contents.',
            'Update fields and check all reference targets and accessibility before submission.',
        ],
        mistakes: [
            'Manually renumbering captions breaks automatic consistency.',
            'A copied online picture without permission or attribution is not acceptable evidence.',
        ],
        trouble: [
            'If a cross-reference says Error! Reference source not found, recreate or retarget it to an existing heading/caption.',
            'If a Table of Figures misses an image, insert a real caption with the expected label and update the table.',
        ],
        command: [
            'Which feature generates a list from figure captions?',
            'Table of Figures',
            'Navigation zoom',
            'Text Highlight Color',
            'Paste',
        ],
        scenario: [
            'You moved Figure 3 before Figure 2. What is the correct next step?',
            'Update captions and cross-reference fields, then inspect them',
            'Manually type all numbers',
            'Delete all captions',
            'Only change page color',
        ],
        independent:
            'Add a fourth figure, reference it in text and update the figure list without manually typing page numbers.',
    },
    {
        title: 'Advanced Mail Merge and Automation',
        exercise: 'Personalized Certificates',
        filename: 'Personalized_Certificates.docx',
        why: 'An Excel recipient source and conditional rules can produce many accurate personalized certificates. A clean source table and a preview of every record are essential controls.',
        topics: [
            'Excel recipient source',
            'Conditional merge fields',
            'IF…THEN…ELSE rules',
            'Certificates',
            'Labels and envelopes',
            'Directory merge concept',
        ],
        terms: {
            Data_source: 'The structured recipient table used by the merge.',
            Conditional_rule:
                'Selects output text based on a recipient field value.',
            IF_THEN_ELSE:
                'A merge rule with a condition and separate true/false outputs.',
            Directory_merge:
                'Combines records into one continuous listing rather than separate letters.',
        },
        steps: [
            'In Excel create headers Name, Award, Category and Date with at least five fictional records. Format dates/text consistently, save as .xlsx and close the workbook.',
            'Design a certificate in Word. Mailings > Start Mail Merge > Letters and Select Recipients > Use an Existing List selects the workbook and correct sheet.',
            'Insert Name, Award and Date fields. Keep layout accessible and readable; avoid placing essential words only inside an image.',
            'Mailings > Rules > If…Then…Else: compare Category with your chosen value and supply both output phrases. Test one record for each branch.',
            'Preview all five records, including the longest name and both condition branches. Inspect date formats and blank values.',
            'Finish & Merge > Edit Individual Documents creates the certificate set. Explore Directory, Labels and Envelopes on practice copies; do not print until stationery and recipients are verified.',
        ],
        text: 'Name | Award | Category | Date\nAlex Example | Science Achievement | Academic | 2026-03-20\nSam Example | Reading Achievement | Academic | 2026-03-20\nLee Example | Teamwork | Service | 2026-03-20\nPat Example | Mathematics | Academic | 2026-03-20\nKim Example | Leadership | Service | 2026-03-20',
        tasks: [
            'Prepare at least five fictional recipients in an Excel source.',
            'Create personalized certificates with a conditional phrase.',
            'Test both IF rule branches and inspect every generated certificate.',
            'Submit main document, merged output and the .xlsx source containing no real personal data.',
        ],
        mistakes: [
            'A workbook with multiple header rows or merged cells makes an unreliable recipient table.',
            'A conditional rule with no tested false branch can omit required text.',
        ],
        trouble: [
            'If a sheet is missing, save and close Excel, then select the correct workbook/sheet again.',
            'If dates display unexpectedly, inspect source types and the merge field’s date format before generating the final set.',
        ],
        command: [
            'Which merge feature chooses different text according to a field value?',
            'If…Then…Else rule',
            'Crop',
            'Restrict Editing',
            'Paragraph Border',
        ],
        scenario: [
            'Long names run outside the certificate text box. What should you do?',
            'Revise the layout and preview the longest names before merging again',
            'Delete those recipients',
            'Reduce all text until unreadable',
            'Print without checking',
        ],
        independent:
            'Add another fictional recipient in the opposite rule category and produce a correct certificate.',
    },
    {
        title: 'Collaboration, Review, and Document Security',
        exercise: 'Reviewed One-page Report',
        filename: 'Reviewed_Report.docx',
        why: 'Track Changes records proposed edits separately from comments. Review decisions, document inspection and accessibility checks prepare a responsible final copy without silently exposing revision history.',
        topics: [
            'Comments',
            'Track Changes',
            'Accept and Reject',
            'Compare and Combine',
            'Co-authoring concept',
            'Document Inspector',
            'Accessibility Checker',
            'Restrict Editing',
            'Mark as Final',
            'Digital signature concept',
        ],
        terms: {
            Tracked_change:
                'A recorded insertion, deletion or formatting proposal.',
            Comment:
                'A discussion note that does not itself replace the document text.',
            Compare: 'Shows differences between two versions.',
            Mark_as_Final:
                'A status discouraging accidental edits, not a security boundary.',
        },
        steps: [
            'Write a one-page school report and save an original copy. Review > Track Changes turns revision tracking on.',
            'Make at least five identifiable edits. Add three useful comments tied to relevant text.',
            'Review changes one by one: Accept two, Reject one, and retain other tracked edits in the review copy. Explain each decision in the reflection.',
            'Review > Compare compares the original and revised versions. Discuss Combine for collecting reviewer revisions and co-authoring only in an authorized shared environment.',
            'Run Review > Check Accessibility (or the available Accessibility command) and correct missing alt text, poor headings and simple table problems.',
            'On a separate final copy, File > Info > Check for Issues > Inspect Document identifies personal metadata and hidden content. Review before removing information; do not destroy the evidence copy.',
            'Discuss Restrict Editing, Mark as Final and digital signatures: each solves a different problem. Do not claim these replace access controls or encryption.',
        ],
        text: 'School Learning Report\nOur class completed a collaborative research activity. The report describes planning, teamwork and the results of the activity.',
        tasks: [
            'Create the one-page report and make five tracked edits.',
            'Add three comments; accept two changes and reject one.',
            'Run Accessibility Checker and Document Inspector on a separate copy.',
            'Upload the review copy with retained evidence and explain at least one accessibility correction and one privacy check.',
        ],
        mistakes: [
            'Deleting text while Track Changes is off leaves no tracked deletion.',
            'Accept All before saving evidence removes the visible review trail.',
        ],
        trouble: [
            'If edits are invisible, choose an appropriate All Markup display and inspect Show Markup settings.',
            'If a comment seems missing, open the Comments pane and confirm the correct document version.',
        ],
        command: [
            'Which feature records proposed insertions and deletions?',
            'Track Changes',
            'Mail Merge',
            'Page Color',
            'Zoom',
        ],
        scenario: [
            'You need a clean public copy without losing review evidence. What is the best workflow?',
            'Keep the review copy and inspect a separate final copy',
            'Overwrite the only evidence copy',
            'Disable every protection',
            'Send hidden metadata without checking',
        ],
        independent:
            'Track a new correction, comment on it and decide whether to accept it with an explanation.',
    },
    {
        title: 'Word Automation and Advanced Productivity',
        exercise: 'Automated Report Formatting',
        filename: 'Automated_Report_Formatting.docm',
        why: 'Fields and reusable content reduce repeated work. A small self-recorded formatting macro can demonstrate automation, but macro-enabled files must be handled cautiously and never used to bypass Office security.',
        topics: [
            'Fields',
            'Quick Parts',
            'AutoText',
            'Building Blocks',
            'Automatic date/time',
            'Document properties',
            'Macro concepts',
            'Record and run a simple macro',
            'Macro security',
            'Introduction to Word VBA',
        ],
        terms: {
            Field: 'A value Word can generate or update, such as a date or document property.',
            Quick_Parts:
                'Reusable content or fields inserted from the Insert tab.',
            Macro: 'A recorded or written series of commands; macro-enabled documents use .docm.',
            VBA: 'The programming environment behind many Office macros; this lesson limits work to simple local formatting.',
        },
        steps: [
            'Create headings and body paragraphs. Insert > Quick Parts > Document Property adds a title/author property where available. Insert Date & Time and compare a fixed date with an updating date field.',
            'Save a reusable heading or signature block with Quick Parts/AutoText where available. Insert it into another practice location and compare with normal copy/paste.',
            'Save an initial .docx. In your school-authorized Word desktop environment, View > Macros > Record Macro names FormatPracticeHeading and stores it in this practice document, not Normal.dotm.',
            'While recording, apply one safe heading format to selected text using the ribbon, then Stop Recording. Do not record file, network, shell or personal-data operations.',
            'If school policy allows, select a different practice heading and run only the macro you just recorded. Verify that it formats the selection consistently. If macros are blocked, keep protections enabled and submit the recording plan and nonmacro formatting evidence instead.',
            'Save as Word Macro-Enabled Document (.docm) only when a local recording exists. Inspect its VBA code with teacher supervision to relate recorded commands to formatting actions. Do not enable unknown macros or change Trust Center security.',
        ],
        text: 'School Report\nIntroduction\nOur report uses consistent headings and paragraphs.\nDiscussion\nA reusable format saves time and reduces inconsistent edits.',
        tasks: [
            'Create headings and paragraphs with a repeatable format.',
            'Insert an automatic field and one reusable content item.',
            'Record one simple heading-format macro only if the school authorizes it; explain exactly what it automates.',
            'Submit .docm evidence or a .docx/.pdf plan when macros are blocked, clearly identifying the blocked feature and manual equivalent.',
        ],
        mistakes: [
            'Saving a macro in Normal.dotm can affect unrelated documents.',
            'Enabling an unknown downloaded macro to finish an exercise is unsafe and unnecessary.',
        ],
        trouble: [
            'If macros are blocked by policy, leave protections on and use the documented plan/manual alternative.',
            'If recorded formatting affects unintended text, undo, select the correct range and inspect the recording with your teacher.',
        ],
        command: [
            'Which format preserves a document’s recorded VBA macro?',
            'DOCM',
            'DOCX',
            'DOTX',
            'PDF',
        ],
        scenario: [
            'Word blocks an unknown downloaded macro. What should you do?',
            'Keep protections enabled and use trusted, teacher-approved practice or the nonmacro alternative',
            'Disable Trust Center security',
            'Rename it to .docx and enable it',
            'Run it on the school server',
        ],
        independent:
            'Explain a short safe automation plan and reproduce the formatting manually without enabling unknown code.',
    },
];
const demoCommands = {
    1: [['create-save', 'Create, save and reopen', 'File > Save As', 'normal']],
    2: [
        ['select', 'Selecting text', 'Drag across text', 'selected'],
        ['bold', 'Apply Bold', 'Home > Font > Bold', 'bold'],
        [
            'italic-underline',
            'Italic and Underline',
            'Home > Font > Italic / Underline',
            'underline',
        ],
        [
            'font-size',
            'Font Type and Font Size',
            'Home > Font family / Size',
            'font',
        ],
        ['font-color', 'Font Color', 'Home > Font > Font Color', 'color'],
        [
            'highlight',
            'Text Highlight',
            'Home > Font > Text Highlight Color',
            'highlight',
        ],
        ['copy-paste', 'Copy and Paste', 'Ctrl+C then Ctrl+V', 'copy'],
        [
            'clear',
            'Clear Formatting',
            'Home > Font > Clear All Formatting',
            'clear',
        ],
    ],
    3: [
        [
            'alignment',
            'Text Alignment',
            'Home > Paragraph > Alignment',
            'justify',
        ],
        [
            'line-spacing',
            'Apply 1.5 Line Spacing',
            'Home > Paragraph > Line and Paragraph Spacing > 1.5',
            'spacing',
        ],
        [
            'first-indent',
            'First-line Indent',
            'Paragraph dialog > Special > First line',
            'first-indent',
        ],
        [
            'hanging-indent',
            'Hanging Indent',
            'Paragraph dialog > Special > Hanging',
            'hanging-indent',
        ],
        ['bullets', 'Bullets', 'Home > Paragraph > Bullets', 'bullets'],
        ['numbering', 'Numbering', 'Home > Paragraph > Numbering', 'numbering'],
        [
            'border-shading',
            'Paragraph Borders and Shading',
            'Home > Paragraph > Shading / Borders',
            'border',
        ],
    ],
    4: [
        [
            'orientation',
            'Portrait to Landscape',
            'Layout > Orientation > Landscape',
            'landscape',
        ],
        ['margins', 'Adjust Margins', 'Layout > Margins', 'margins'],
        ['page-number', 'Insert Page Numbers', 'Insert > Page Number', 'field'],
        ['columns', 'Create Two Columns', 'Layout > Columns > Two', 'columns'],
    ],
    5: [
        [
            'picture',
            'Insert and Resize Picture',
            'Insert > Pictures; drag a corner',
            'picture',
        ],
        [
            'wrapping',
            'Picture Text Wrapping',
            'Picture Format > Wrap Text',
            'picture',
        ],
        ['table', 'Create a Table', 'Insert > Table', 'table'],
        ['merge', 'Merge Cells', 'Table Layout > Merge Cells', 'table'],
        [
            'table-style',
            'Apply a Table Style',
            'Table Design > Table Styles',
            'table',
        ],
    ],
};
const rubric = {
    'Document Structure and Organization': 20,
    'Formatting and Styles': 15,
    'Tables, Images, and References': 15,
    'Mail Merge / Automation': 15,
    'Forms and Protection': 10,
    'Accuracy and Professional Appearance': 15,
    'Accessibility and Usability': 10,
};
const cases = [
    {
        level: 'Beginner',
        title: 'School Project Cover and Report',
        brief: 'Create a two-page school report: The Importance of Information Technology in Education. Page 1 is a cover with school name, title, student name, Grade/Section, teacher, date and a relevant permitted image. Page 2 contains Introduction, Importance of technology in education, Three benefits and Conclusion. Use fictional identifying information in the practice copy.',
        deliverables: [
            'Cover page with all seven requested elements',
            'Report page with original paragraphs and three benefits',
            'Character and paragraph formatting, deliberate page setup and image wrapping',
            'School header/footer and automatic page numbering',
            'Readable headings, sufficient contrast and meaningful image alt text',
        ],
        allowed_uploads: ['docx', 'pdf'],
    },
    {
        level: 'Intermediate',
        title: 'School Event Documentation Package',
        brief: 'Your school plans a Career Guidance Program. Produce a coordinated documentation package that organizers can revise and use. Keep the editable originals and use only fictional recipients in practice.',
        deliverables: [
            'Cover page and event program using consistent Styles',
            'Event report with automatic Table of Contents, tables and captioned images',
            'Mail Merge invitation: main document, fictional recipient source and merged output',
            'Fillable evaluation form with suitable controls and reviewable protection',
            'Consistent headers/footers, field updates and accessibility checks',
        ],
        allowed_uploads: ['docx', 'pdf', 'xlsx'],
    },
    {
        level: 'Advanced',
        title: 'Complete School Administrative Document System',
        brief: 'Build a reusable administrative document system for a school program. Demonstrate how an organizer starts a report, records results, produces personalized outputs, collects evaluations and reviews a final accessible copy. Keep review evidence and clean publication copies separate.',
        deliverables: [
            'Official .dotx report template and completed program report',
            'Figures and tables with captions, references and updated report lists',
            'Mail Merge certificates/letters for at least five fictional recipients, with source data',
            'Protected, teacher-reviewable evaluation form',
            'Review copy with tracked changes/comments and documented accept/reject decisions',
            'Reusable content or a safe self-recorded formatting macro, or a policy-blocked nonmacro alternative',
            'Security/privacy inspection and an accessibility/testing report',
        ],
        allowed_uploads: ['docx', 'dotx', 'docm', 'pdf', 'xlsx'],
    },
];
function question([prompt, answer, ...wrong], rotation) {
    const choices = [answer, ...wrong];
    for (let i = 0; i < rotation % 4; i++) choices.push(choices.shift());
    return {
        question: prompt,
        choices,
        answer: choices.indexOf(answer),
        explanation: `${answer}. Check the command location and verify the visible result in your practice document.`,
    };
}
const output = lessons.map((l, i) => {
    const level = ['Beginner', 'Intermediate', 'Advanced'][Math.floor(i / 5)];
    const definitions = Object.entries(l.terms).map(
        ([term, meaning]) => `${term.replaceAll('_', ' ')}: ${meaning}`,
    );
    const demos = (
        demoCommands[i + 1] ?? [
            [
                'workflow',
                'Guided workflow',
                l.steps[0].split(':')[0],
                i < 10 ? 'heading' : 'field',
            ],
        ]
    ).map(([key, title, command, effect], n) => {
        let steps = [
            {
                caption: 'Before: inspect the unchanged practice text.',
                command: 'Document area',
                effect: 'normal',
                text: 'Our school learning activities encourage careful practice. Use Word commands to communicate clearly.',
            },
            {
                caption:
                    'Select the relevant word or paragraph before applying the command.',
                command: 'Select the target text',
                effect: 'selected',
            },
            {
                caption: `Find ${command}. Use this command on the selected range.`,
                command,
                effect: 'selected',
            },
            {
                caption: `After: ${title}. Compare the result with the unchanged text and check the scope of the change.`,
                command,
                effect,
            },
        ];
        if (key === 'alignment')
            steps = [
                steps[0],
                ...['left', 'center', 'right', 'justify'].map((effect) => ({
                    caption: `Apply ${effect} alignment. Compare where the paragraph edges fall.`,
                    command: `Home > Paragraph > ${effect}`,
                    effect,
                })),
            ];
        if (key === 'italic-underline')
            steps = [
                steps[0],
                steps[1],
                {
                    caption: 'Apply Italic: the selected letters slant.',
                    command: 'Home > Font > Italic',
                    effect: 'italic',
                },
                {
                    caption:
                        'Then apply Underline: the selected letters have a line beneath them.',
                    command: 'Home > Font > Underline',
                    effect: 'underline',
                },
            ];
        if (key === 'workflow')
            steps = l.steps.map((caption, index) => ({
                caption,
                command: caption.split('.')[0],
                effect: index === l.steps.length - 1 ? effect : 'normal',
                text: `${l.exercise}\n\n${l.text}`,
            }));
        if (key === 'create-save')
            steps = [
                {
                    caption: 'Start the authorized Microsoft Word application.',
                    command: 'Start > Microsoft Word',
                    effect: 'normal',
                    text: 'Word start screen',
                },
                {
                    caption:
                        'Choose Blank Document. The document area is empty.',
                    command: 'New > Blank Document',
                    effect: 'normal',
                    text: '[Blank document]',
                },
                {
                    caption:
                        'Type the title and short paragraph in the document area.',
                    command: 'Document area > Type',
                    effect: 'normal',
                    text: `My First Microsoft Word Document\n\n${l.text}`,
                },
                {
                    caption:
                        'Click Save. An unnamed document needs its first filename and location.',
                    command: 'File > Save / Save As',
                    effect: 'normal',
                    text: 'Choose a school-approved folder.',
                },
                {
                    caption:
                        'Enter My_First_Word_Document and choose Word Document (.docx), then Save.',
                    command: 'Save As > My_First_Word_Document.docx',
                    effect: 'normal',
                    text: 'Saved: My_First_Word_Document.docx',
                },
                {
                    caption:
                        'Close the saved document. Closing does not delete the saved file.',
                    command: 'File > Close',
                    effect: 'normal',
                    text: '[Document closed]',
                },
                {
                    caption:
                        'Reopen the saved file and verify its title and paragraph.',
                    command: 'File > Open > My_First_Word_Document.docx',
                    effect: 'normal',
                    text: `My First Microsoft Word Document\n\n${l.text}`,
                },
            ];
        if (key === 'font-size')
            steps = [
                {
                    caption: 'Before: inspect the normal text.',
                    command: 'Document area',
                    effect: 'normal',
                },
                {
                    caption: 'Select the words that should change.',
                    command: 'Select target words',
                    effect: 'selected',
                },
                {
                    caption: 'Open the Font family dropdown in Home > Font.',
                    command: 'Home > Font > Font family ▼',
                    effect: 'selected',
                },
                {
                    caption:
                        'Choose Georgia and inspect the different letter shapes.',
                    command: 'Font family > Georgia',
                    effect: 'font',
                },
                {
                    caption:
                        'Open Font Size and choose 18 pt for the selected words.',
                    command: 'Home > Font > Font Size > 18',
                    effect: 'font',
                },
                {
                    caption:
                        'After: compare the selected words with the unchanged text; the font and size are different.',
                    command: 'Georgia · 18 pt',
                    effect: 'font',
                },
            ];
        return {
            key,
            title,
            description: `Instructional Word-style demonstration: ${title}. This is a guided illustration, not Microsoft Word. Practice the real command in your installed Word application.`,
            media_type: 'interactive_demo',
            steps,
            transcript: steps
                .map((s, j) => `${j + 1}. ${s.caption} Command: ${s.command}`)
                .join('\n'),
            display_order: n + 1,
            is_required: true,
            status: 'published',
        };
    });
    const allowed =
        i === 10
            ? ['dotx', 'docx', 'pdf']
            : i === 14
              ? ['docm', 'docx', 'pdf']
              : i === 8 || i === 12
                ? ['docx', 'pdf', 'xlsx']
                : ['docx', 'pdf'];
    const reviews = [
        `Explain the difference between ${Object.keys(l.terms)[0].replaceAll('_', ' ')} and ${Object.keys(l.terms)[1].replaceAll('_', ' ')}.`,
        `Where would you find the first command used in this lesson?`,
        `How will you recognize that ${l.exercise} is correct?`,
    ];
    const quiz = [
        question(l.command, i),
        question(l.scenario, i + 1),
        question(
            [
                'Before applying a formatting command to only part of a document, what should you check?',
                'The intended text or paragraph is selected',
                'The filename has no spaces',
                'Zoom is at its maximum',
                'All pages are deleted',
            ],
            i + 2,
        ),
        question(
            [
                'How should you verify this practical task before submitting?',
                'Reopen the saved file and compare it with the requirements',
                'Only open the lesson',
                'Only rename an empty document',
                'Assume the command worked without checking',
            ],
            i + 3,
        ),
        question(
            [
                'What should you do when a required command is unavailable in Word for the web or blocked by school policy?',
                'Keep protections enabled and document the supported desktop or approved alternative',
                'Disable every security setting',
                'Upload an executable instead',
                'Claim the command ran successfully',
            ],
            i,
        ),
    ];
    return {
        position: i + 1,
        level,
        title: l.title,
        objectives: [
            `Explain the purpose and location of ${l.topics.slice(0, 2).join(' and ')}.`,
            `Independently produce ${l.exercise} using the stated requirements.`,
            `Inspect the saved output and correct common errors.`,
        ],
        introduction: l.why,
        explanation: definitions.join('\n\n'),
        guided_practice: `Follow the numbered demonstration on a disposable copy. After each command, explain what changed and compare with the before state.\n\n${l.steps.map((s, j) => `${j + 1}. ${s}`).join('\n')}`,
        activity: l.tasks.map((t, j) => `${j + 1}. ${t}`).join('\n'),
        expected_result: `An editable, reopened ${l.filename} satisfying every task below.\n${l.tasks.join('\n')}`,
        quiz,
        application_content: {
            application: 'Microsoft Word',
            course_type: 'Application Software / Productivity',
            topics: l.topics,
            why: l.why,
            terms: definitions,
            commands: l.steps.map((s) => s.split('.')[0]),
            steps: l.steps,
            try_it: l.independent,
            exercise: {
                title: l.exercise,
                filename: l.filename,
                sample: l.text,
                tasks: l.tasks,
            },
            common_mistakes: l.mistakes,
            troubleshooting: l.trouble,
            quick_review: reviews,
            identify_command: l.command[0],
            scenario: l.scenario[0],
            independent: l.independent,
            summary: `Use the selected range, apply the appropriate command, inspect the result and save. ${l.why}`,
            mastery: [
                'I can identify the tool and locate it.',
                'I can explain when and why to use it.',
                'I can apply it without following the steps.',
                'I can recognize and correct a mistake.',
            ],
            submission: `Upload ${l.filename} and any requested companion documents. Describe what you did, one check and any correction. Use fictional practice information. Do not include passwords.`,
            allowed_uploads: allowed,
            edition_note:
                'Demonstrations describe current Word desktop for Windows. Ribbon names and availability can vary by edition. Word for the web and mobile may lack Mail Merge, Developer controls, macros or advanced references; use an authorized desktop installation or document a teacher-approved alternative. CodeLab does not install or license Microsoft Word.',
            sources: [
                {
                    title: 'Microsoft: line and paragraph spacing',
                    url: 'https://support.microsoft.com/en-us/word/change-the-line-spacing-in-word',
                },
                {
                    title: 'Microsoft: indents and spacing',
                    url: 'https://support.microsoft.com/en-us/word/adjust-indents-and-spacing',
                },
                {
                    title: 'Microsoft: Mail Merge rules',
                    url: 'https://support.microsoft.com/en-us/word/set-the-rules-for-a-mail-merge',
                },
            ],
        },
        demonstrations: demos,
    };
});
await writeFile(
    'database/data/word-course.json',
    JSON.stringify(
        { lessons: output, cases: cases.map((c) => ({ ...c, rubric })) },
        null,
        2,
    ) + '\n',
);
console.log(
    'Authored 15 Word lessons, 15 exercises, 3 case studies and ' +
        output.reduce((n, l) => n + l.demonstrations.length, 0) +
        ' demonstrations.',
);
