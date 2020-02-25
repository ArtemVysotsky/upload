<?php
/**
 * Файл з API для керування процесом завантаження
 *
 * @author      Артем Висоцький <a.vysotsky@gmail.com>
 * @link        https://github.com/ArtemVysotsky/Upload
 * @copyright   GNU General Public License v3
 */

/** ToDo: Перевірити видалення файла при помилці */

set_error_handler('exceptionErrorHandler');
$output = [];

try {
    require_once('File.php');
    if (!isset($_GET['action'])) throw new Exception('Відсутня дія');
    if (!isset($_GET['name'])) throw new Exception('Відсутня назва файлу');
    $file = new File($_GET['name']);

    try {
        if (isset($_POST['hash'])) $file->setHash($_POST['hash']);
        switch($_GET['action']) {
            case 'open': $output['hash'] = $file->open(); break;
            case 'append': {
                if ((count($_FILES) == 0) || (!isset($_FILES['chunk'])))
                    throw new Exception('Відсутній фрагмент файла');
                $output['size'] = $file->append($_FILES['chunk'], $_POST['offset']);
            } break;
            case 'close': $output['size'] = $file->close($_POST['time'] ?? null); break;
            case 'remove': $file->remove(); break;
            default: throw new Exception('Невідома дія');
        }

    } catch (Exception $exception) {
        $file->remove();
        throw $exception;
    }

} catch (Exception $exception) {
    header('HTTP/1.x 500 Internal Server Error');
    $output['exception'] = $exception->getMessage();
}

echo json_encode($output, JSON_UNESCAPED_UNICODE);


/**
 * Перетворює помилки у винятки
 *
 * @param integer $number Номер помилки
 * @param string $string Опис помилки
 * @param string $file Назва файлу, в якому виникла помилка
 * @param integer $line Номер рядка файлу, в якому виникла помилка
 * @throws ErrorException Error to Exception
 */
function exceptionErrorHandler(int $number, string $string, string $file, int $line) {
    throw new ErrorException($string, 0, $number, $file, $line);
}