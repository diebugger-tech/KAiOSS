BEGIN TRANSACTION;

FOR $todo IN (SELECT * FROM wiki WHERE typ = 'todo') {

    LET $status = IF $todo.status = 'done' THEN 'done' ELSE 'offen' END;

    LET $priorität = IF $todo.prioritaet = 'high' THEN 3
                     ELSE IF $todo.prioritaet = 'medium' THEN 2
                     ELSE 1 END;

    LET $verifikation = IF $todo.status = 'done' THEN 'bestanden'
                        ELSE 'ausstehend' END;

    CREATE task CONTENT {
        titel:              $todo.titel OR 'Ohne Titel',
        beschreibung:       $todo.inhalt,
        projekt:            $todo.projekt OR 'KAiOSS',
        status:             $status,
        risiko:             'medium',
        verifikation:       $verifikation,
        verifiziert_von:    IF $todo.status = 'done' THEN 'human' ELSE NONE END,
        zugewiesen_an:      NONE,
        akzeptanzkriterien: [{ kriterium: $todo.titel OR 'Ohne Titel', erfüllt: $todo.status = 'done' }],
        depends_on:         [],
        priorität:          $priorität,
        tags:               NONE,
        erstellt:           $todo.erstellt OR time::now()
    };

    UPDATE $todo.id SET typ = 'todo_migrated';
};

COMMIT TRANSACTION;
