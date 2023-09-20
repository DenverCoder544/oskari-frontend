import React from 'react';
import { ThemeConsumer } from 'oskari-ui/util';
import { getNavigationTheme } from 'oskari-ui/theme';
import { Button } from 'oskari-ui';
import PropTypes from 'prop-types';
import styled from 'styled-components';

const StyledButton = styled(Button)`
    height: 28px;
    min-width: ${props => props.$minWidth}px;
    font-size: 14px;
    margin: 0 2px;
    margin-top: ${props => props.$marginTop || 0}px;
    margin-bottom: ${props => props.$marginBottom || 0}px;
    margin-right: ${props => props.$marginRight || 2}px;
    margin-left: ${props => props.$marginLeft || 2}px;
    border: none;
    opacity: ${props => props.$opacity};
    border-radius: calc(${props => props.$rounding ? props.$rounding / 100 : 0} * 32px);
    color: ${props => props.$active ? props.$hoverColor : props.$iconColor};
    background: ${props => props.$backgroundColor};
    box-shadow: 1px 1px 2px rgb(0 0 0 / 60%);
    path {
        fill: ${props => props.$active ? props.$hoverColor : props.$iconColor};
    }
    &:hover {
        color: ${props => props.$hoverColor};
        background: ${props => props.$backgroundColor};
        path {
            fill: ${props => props.$hoverColor};
        }
    }
    &:active {
        color: ${props => props.$hoverColor};
        background: ${props => props.$backgroundColor};
        path {
            fill: ${props => props.$active ? props.$hoverColor : props.$iconColor};
        }
    }
    &:focus {
        color: ${props => props.$hoverColor};
        background: ${props => props.$backgroundColor};
        path {
            fill: ${props => props.$hoverColor};
        }
    }
    display: flex;
    align-items: center;
    justify-content: center;
    svg {
        margin-right: 5px;
        font-size: 16px;
    }
`;

const ThemedButton = ThemeConsumer(({ theme = {}, active, ...rest }) => {
    const helper = getNavigationTheme(theme);
    const rounding = helper.getButtonRoundness();
    const icon = helper.getTextColor();
    const background = helper.getButtonColor();
    const hover = helper.getButtonHoverColor();
    const opacity = helper.getButtonOpacity();
    return (
        <StyledButton
            $rounding={rounding}
            $iconColor={icon}
            $backgroundColor={background}
            $hoverColor={hover}
            $active={active}
            $opacity={opacity}
            {...rest}
        />
    );
});

export const MapModuleTextButton = ({ visible, onClick, icon, text, active, position, loading, ...rest }) => {
    if (!visible) {
        return null;
    };

    return <ThemedButton
        icon={icon || null}
        onClick={onClick}
        active={active}
        position={position}
        loading={loading}
        {...rest}
    >
        {text}
    </ThemedButton>;
};

MapModuleTextButton.propTypes = {
    visible: PropTypes.bool,
    onClick: PropTypes.func,
    icon: PropTypes.any,
    text: PropTypes.any,
    active: PropTypes.bool,
    position: PropTypes.string,
    loading: PropTypes.bool
};
