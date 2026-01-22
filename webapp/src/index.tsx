import React from 'react';
import manifest from './manifest';
import type {PluginRegistry} from 'mattermost-webapp/types/plugins';
import {getPost} from 'mattermost-redux/selectors/entities/posts';
import {isSystemMessage} from 'mattermost-redux/utils/post_utils';
import type {Post} from '@mattermost/types/posts';

const pluginId = manifest.id;

// Максимальная длина сообщения в Mattermost
const MAX_MESSAGE_LENGTH = 16383;

// Minimal store shape we use in this plugin
type StoreLike = {
    getState: () => any;
    dispatch?: (...args: any[]) => any;
};

// Компонент отображения в меню
function QuoteMenuItem() {
    return (
        <>
            <span style={{marginRight: '4px'}}>💬</span>
            {'Quote message'}
        </>
    );
}

/**
 * Безопасно получает имя пользователя из store
 */
function getUsernameFromStore(store: StoreLike, userId: string): string {
    try {
        const state = store.getState();
        const username = state?.entities?.users?.profiles?.[userId]?.username;
        
        if (!username || typeof username !== 'string') {
            return '';
        }
        
        // Валидация формата username (только буквы, цифры, дефис, подчеркивание, точка)
        if (!/^[a-z0-9._-]+$/i.test(username)) {
            console.warn('[QuotePlugin] Invalid username format:', username);
            return '';
        }
        
        return username;
    } catch (error) {
        console.error('[QuotePlugin] Error getting username:', error);
        return '';
    }
}

/**
 * Форматирует сообщение в цитату Markdown
 */
function formatQuote(message: string, username: string): string {
    // Удаляем лишние пробелы в начале и конце
    const trimmedMessage = message.trim();
    
    // Разбиваем на строки и добавляем префикс цитаты
    const quotedLines = trimmedMessage
        .split('\n')
        .map(line => `> ${line}`)
        .join('\n');
    
    // Добавляем упоминание пользователя, если имя доступно
    const mention = username ? `@${username} ` : '';
    
    return `${quotedLines}\n\n${mention}`;
}

/**
 * Находит подходящий textarea для вставки цитаты
 */
function findTargetComposer(post: Post): HTMLTextAreaElement | null {
    // Проверяем, является ли пост частью треда
    const isThreadReply = Boolean(post.root_id && post.root_id.trim().length > 0);
    
    // Проверяем видимость RHS (правая панель)
    const rhsTextbox = document.querySelector<HTMLTextAreaElement>('#reply_textbox');
    const isRhsVisible = Boolean(rhsTextbox && rhsTextbox.offsetParent !== null);
    
    // Список селекторов в порядке приоритета (только надёжные ID и контейнеры)
    let selectors: string[];
    
    if (isThreadReply && isRhsVisible) {
        // Если пост в треде и RHS открыт - приоритет RHS
        selectors = [
            '#reply_textbox',
            '#rhsContainer textarea',
            '#post_textbox'
        ];
    } else {
        // Иначе - приоритет главному composer
        selectors = [
            '#post_textbox',
            '#reply_textbox',
            '#rhsContainer textarea'
        ];
    }
    
    // Ищем первый видимый и доступный textarea
    for (const selector of selectors) {
        const element = document.querySelector<HTMLTextAreaElement>(selector);
        
        if (element && 
            element.offsetParent !== null && 
            !element.disabled && 
            !element.readOnly) {
            return element;
        }
    }
    
    return null;
}

/**
 * Вставляет текст в textarea с поддержкой событий Mattermost
 */
function insertTextIntoComposer(textarea: HTMLTextAreaElement, text: string): boolean {
    try {
        const currentValue = textarea.value || '';
        const newValue = currentValue ? `${currentValue}\n${text}` : text;
        
        // Проверка лимита длины сообщения
        if (newValue.length > MAX_MESSAGE_LENGTH) {
            console.warn('[QuotePlugin] Quote would exceed maximum message length');
            alert(`Цитата слишком длинная. Максимальная длина сообщения: ${MAX_MESSAGE_LENGTH} символов.`);
            return false;
        }
        
        // Устанавливаем фокус
        textarea.focus();
        
        // Обновляем значение
        textarea.value = newValue;
        
        // Генерируем события для Mattermost
        textarea.dispatchEvent(new Event('input', {bubbles: true, cancelable: true}));
        textarea.dispatchEvent(new Event('change', {bubbles: true, cancelable: true}));
        
        // Перемещаем курсор в конец
        try {
            textarea.selectionStart = textarea.selectionEnd = textarea.value.length;
            textarea.scrollTop = textarea.scrollHeight;
        } catch (error) {
            // Игнорируем ошибки при работе с селекцией (старые браузеры)
        }
        
        return true;
    } catch (error) {
        console.error('[QuotePlugin] Error inserting text:', error);
        return false;
    }
}

/**
 * Обрабатывает цитирование сообщения
 */
function handleQuote(store: StoreLike, postId: string): void {
    try {
        // Получаем пост из store
        const post: Post | undefined = getPost(store.getState(), postId);
        
        if (!post) {
            console.warn('[QuotePlugin] Post not found:', postId);
            return;
        }
        
        if (!post.message || !post.message.trim()) {
            console.warn('[QuotePlugin] Post has no message');
            return;
        }
        
        // Получаем имя пользователя безопасно
        const username = getUsernameFromStore(store, post.user_id);
        
        // Форматируем цитату
        const quote = formatQuote(post.message, username);
        
        // Находим целевой composer
        const targetComposer = findTargetComposer(post);
        
        if (targetComposer) {
            // Вставляем в найденный composer
            const success = insertTextIntoComposer(targetComposer, quote);
            
            if (!success) {
                // Если вставка не удалась, используем fallback
                fallbackInsertText(quote);
            }
        } else {
            // Если composer не найден, используем fallback
            fallbackInsertText(quote);
        }
    } catch (error) {
        console.error('[QuotePlugin] Error in handleQuote:', error);
        alert('Произошла ошибка при цитировании сообщения. Проверьте консоль для деталей.');
    }
}

/**
 * Fallback метод для вставки текста через кастомное событие
 */
function fallbackInsertText(text: string): void {
    try {
        window.dispatchEvent(new CustomEvent('insertText', {
            detail: text,
            bubbles: true,
            cancelable: true
        }));
    } catch (error) {
        console.error('[QuotePlugin] Fallback insertText failed:', error);
    }
}

/**
 * Проверяет, можно ли цитировать сообщение
 */
function canQuotePost(store: StoreLike, postOrId: string | Post): boolean {
    try {
        const post = typeof postOrId === 'string' 
            ? getPost(store.getState(), postOrId) 
            : postOrId;
        
        if (!post) {
            return false;
        }
        
        // Не показываем для системных сообщений
        if (isSystemMessage(post)) {
            return false;
        }
        
        // Не показываем для пустых сообщений
        if (!post.message || !post.message.trim()) {
            return false;
        }
        
        // Не показываем для удаленных сообщений
        if (post.state === 'DELETED') {
            return false;
        }
        
        return true;
    } catch (error) {
        console.error('[QuotePlugin] Error in canQuotePost:', error);
        return false;
    }
}

class QuotePlugin {
    private unregisterAction?: () => void;

    initialize(registry: PluginRegistry, store: StoreLike): void {
        console.log('[QuotePlugin] Initializing...');

        try {
            // Регистрируем действие в dropdown меню
            this.unregisterAction = registry.registerPostDropdownMenuAction({
                text: QuoteMenuItem,
                action: (postOrId: string | Post) => {
                    try {
                        const postId = typeof postOrId === 'string' 
                            ? postOrId 
                            : (postOrId as Post).id;
                        
                        handleQuote(store, postId);
                    } catch (error) {
                        console.error('[QuotePlugin] Error in menu action:', error);
                        alert('Произошла ошибка при цитировании. Проверьте консоль.');
                    }
                },
                filter: (postOrId: string | Post) => {
                    return canQuotePost(store, postOrId);
                },
            });

            console.log('[QuotePlugin] Initialized successfully');
        } catch (error) {
            console.error('[QuotePlugin] Initialization failed:', error);
        }
    }

    uninitialize(): void {
        console.log('[QuotePlugin] Uninitializing...');
        
        if (this.unregisterAction) {
            try {
                this.unregisterAction();
            } catch (error) {
                console.error('[QuotePlugin] Error during uninitialization:', error);
            }
        }
    }
}

// Регистрация плагина
if (typeof window.registerPlugin !== 'function') {
    console.warn('[QuotePlugin] window.registerPlugin not found - running in development mode?');
} else {
    try {
        window.registerPlugin(pluginId, new QuotePlugin());
        console.log('[QuotePlugin] Registered successfully');
    } catch (error) {
        console.error('[QuotePlugin] Registration failed:', error);
    }
}
